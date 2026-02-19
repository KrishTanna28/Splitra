const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/mailer');

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP in database with expiration
const storeOTP = async (email, otp) => {
  const expiresAt = new Date(Date.now() + 60000); // 1 minute from now
  
  // Delete any existing OTP for this email
  await pool.query('DELETE FROM otp_codes WHERE email = $1', [email]);
  
  // Insert new OTP
  await pool.query(
    'INSERT INTO otp_codes (email, otp, expires_at) VALUES ($1, $2, $3)',
    [email, otp, expiresAt]
  );
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, upi_id } = req.body;
    
    // Check if email already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (name, email, password, upi_id) VALUES ($1, $2, $3, $4) RETURNING id, name, email',
      [name, email, hashed, upi_id]
    );

    res.status(201).json({ message: 'User registered', user: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email });

    if (!email || !password) {
      console.warn('Login missing email or password', { body: req.body });
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.password) {
      console.error('User record missing password hash for', email);
      return res.status(500).json({ message: 'Server error: user password not set' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP in database
    await storeOTP(email, otp);
    
    // Send OTP via email
    const subject = '🔐 Login OTP - Splitra';
    const body = `
Hello ${user.name},

Your login OTP is: ${otp}

This OTP will expire in 1 minute.

If you didn't request this login, please ignore this email.

Thanks,
Team Splitra
    `;
    
    await sendEmail(email, subject, body);

    res.json({ 
      message: 'OTP sent to your email', 
      email: email,
      requiresOTP: true 
    });
  } catch (err) {
    console.error('Login error:', err && err.message ? err.message : err);
    next(err);
  }
};

exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Check if OTP exists and is valid
    const otpResult = await pool.query(
      'SELECT * FROM otp_codes WHERE email = $1 AND otp = $2 AND expires_at > NOW()',
      [email, otp]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Get user details
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the used OTP
    await pool.query('DELETE FROM otp_codes WHERE email = $1 AND otp = $2', [email, otp]);

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      message: 'Login successful', 
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate new OTP
    const otp = generateOTP();
    
    // Store new OTP
    await storeOTP(email, otp);
    
    // Send new OTP via email
    const subject = '🔐 New Login OTP - Splitra';
    const body = `
Hello ${user.name},

Your new login OTP is: ${otp}

This OTP will expire in 1 minute.

If you didn't request this login, please ignore this email.

Thanks,
Team Splitra
    `;
    
    await sendEmail(email, subject, body);

    res.json({ 
      message: 'New OTP sent to your email',
      email: email
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  const userId = req.user.id;
  const { name, email, upi_id,remove_picture  } = req.body;
  const profile_picture = req.file ? req.file.path : undefined;

  try {
    const fields = [];
    const values = [];
    let index = 1;

    if (name !== undefined) {
      fields.push(`name = $${index++}`);
      values.push(name);
    }
    if (email !== undefined) {
      fields.push(`email = $${index++}`);
      values.push(email);
    }
    if (upi_id !== undefined) {
      fields.push(`upi_id = $${index++}`);
      values.push(upi_id);
    }
    if (remove_picture === "true") {
      fields.push(`profile_picture = NULL`);
    } else if (profile_picture !== undefined) {
      fields.push(`profile_picture = $${index++}`);
      values.push(profile_picture);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(userId);

    const result = await pool.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${index} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Profile updated successfully', user: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.getUserDetails = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const result = await pool.query('SELECT id, name, email, upi_id, profile_picture FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
}