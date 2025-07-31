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

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP in database
    await storeOTP(email, otp);
    
    // Send OTP via email
    const subject = '🔐 Login OTP - Split Payment App';
    const body = `
Hello ${user.name},

Your login OTP is: ${otp}

This OTP will expire in 1 minute.

If you didn't request this login, please ignore this email.

Thanks,
Split Payment App Team
    `;
    
    await sendEmail(email, subject, body);

    res.json({ 
      message: 'OTP sent to your email', 
      email: email,
      requiresOTP: true 
    });
  } catch (err) {
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
    const subject = '🔐 New Login OTP - Split Payment App';
    const body = `
Hello ${user.name},

Your new login OTP is: ${otp}

This OTP will expire in 1 minute.

If you didn't request this login, please ignore this email.

Thanks,
Split Payment App Team
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

exports.addUPI = async (req, res, next) => {
  const userId = req.user.id;
  const { upi_id } = req.body;

  try {
    // Update user details
    const result = await pool.query(
      'UPDATE users SET upi_id = $1 WHERE id = $2 RETURNING *',
      [upi_id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'UPI added successfully', user: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

exports.getUserDetails = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const result = await pool.query('SELECT id, name, email, upi_id FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
}