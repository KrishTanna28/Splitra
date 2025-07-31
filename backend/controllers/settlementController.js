const pool = require('../config/db');
const QRCode = require('qrcode');
const sendEmail = require("../utils/mailer");

exports.generateUPIQRCode = async (req, res) => {
  const userId = req.user.id;
  const receiver_id = req.params.id;
  const userResult = await pool.query('SELECT upi_id FROM users WHERE id=$1', [receiver_id]);
  const upiId = userResult.rows[0].upi_id;
  const amount = await pool.query(
    `SELECT amount FROM settlements WHERE paid_by = $1 AND paid_to = $2`,
    [receiver_id, userId]
  );

  if (!upiId || !amount) {
    return res.status(400).json({ message: 'upiId, name, and amount are required' });
  }

  const upiUrl = `upi://pay?pa=${upiId}&am=${amount}&cu=INR`;

  try {
    const qr = await QRCode.toDataURL(upiUrl);
    res.json({ upiUrl, qrCode: qr });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate QR code' });
  }
};


// Record a manual settlement
exports.addSettlement = async (req, res, next) => {
  const userId = req.user.id;
  const groupId = req.params.groupId;
  const { paidBy, paidTo, amount, note } = req.body;

  try {
    await pool.query(
      `INSERT INTO settlements (group_id, paid_by, paid_to, amount, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [groupId, paidBy, paidTo, amount, note || null]
    );

    res.status(201).json({ message: 'Settlement recorded' });
  } catch (err) {
    next(err);
  }
};

// Get all settlements in a group
exports.getSettlements = async (req, res, next) => {
  const { groupId } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
         s.id,
         s.group_id,
         s.amount,
         s.created_at,
         s.paid_by,
         s.paid_to,
         u1.name AS paid_by_name,
         u2.name AS paid_to_name,
         u1.id AS paid_by_id,
         u2.id AS paid_to_id
       FROM settlements s
       JOIN users u1 ON s.paid_by = u1.id
       JOIN users u2 ON s.paid_to = u2.id
       WHERE s.group_id = $1
       ORDER BY s.created_at DESC`,
      [groupId]
    );

    const settlements = result.rows.map(s => ({
      id: s.id,
      groupId: s.group_id,
      amount: s.amount,
      createdAt: s.created_at,
      paidById: s.paid_by_id,
      paidToId: s.paid_to_id,
      paidBy: s.paid_by,
      paidTo: s.paid_to,
      fromName: s.paid_to_name,   // person who paid now
      toName: s.paid_by_name,     // person who originally paid
      description: `${s.paid_to_name} paid ${s.paid_by_name} ₹${s.amount}`
    }));

    res.status(200).json({ settlements });
  } catch (err) {
    next(err);
  }
};


exports.addRecurringContribution = async (req, res, next) => {
  const userId = req.user.id;
  const { groupId, amount, startDate, frequency, description, category } = req.body;

  if (!groupId || !userId || !amount || !startDate) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Get all users in the group
    const membersRes = await pool.query(
      `SELECT u.id, u.name, u.email FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = $1`,
      [groupId]
    );
    const members = membersRes.rows;

    if (members.length === 0) {
      return res.status(400).json({ message: 'No members in the group' });
    }

    // Insert recurring contribution
    await pool.query(
      `INSERT INTO recurring_contributions (group_id, user_id, amount, start_date, frequency, description, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [groupId, userId, amount, startDate, frequency || 'monthly', description, category]
    );

    res.status(201).json({ message: 'Recurring contribution added' });
  } catch (err) {
    next(err);
  }
};

exports.updateRecurringContribution = async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { amount, startDate, frequency, description, category, active, groupId } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'Missing contribution ID' });
  }

  try {
    // Ensure the contribution belongs to the user
    const checkRes = await pool.query(
      `SELECT * FROM recurring_contributions WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Contribution not found or unauthorized' });
    }

    await pool.query(
      `UPDATE recurring_contributions
       SET amount = COALESCE($1, amount),
           start_date = COALESCE($2, start_date),
           frequency = COALESCE($3, frequency),
           description = COALESCE($4, description),
           category = COALESCE($5, category),
           active = COALESCE($6, active),
           group_id = COALESCE($7, group_id)
       WHERE id = $8`,
      [amount, startDate, frequency, description, category, active, groupId, id]
    );

    res.status(200).json({ message: 'Recurring contribution updated' });
  } catch (err) {
    next(err);
  }
};

exports.deleteRecurringContribution = async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'Missing contribution ID' });
  }

  try {
    // Ensure the contribution belongs to the user
    const checkRes = await pool.query(
      `SELECT * FROM recurring_contributions WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Contribution not found or unauthorized' });
    }

    // Delete it
    await pool.query(
      `DELETE FROM recurring_contributions WHERE id = $1`,
      [id]
    );

    res.status(200).json({ message: 'Recurring contribution deleted' });
  } catch (err) {
    next(err);
  }
};


exports.paymentReminder = async (req, res, next) => {
  const senderId = req.user.id;
  const { receiver_id, amount } = req.body;
  const groupId = req.params.groupId;

  try {
    // Fetch sender name
    const senderResult = await pool.query('SELECT name FROM users WHERE id = $1', [senderId]);
    const senderName = senderResult.rows[0]?.name || 'Someone';

    // Fetch receiver details
    const receiverResult = await pool.query('SELECT name, email FROM users WHERE id = $1', [receiver_id]);
    if (receiverResult.rows.length === 0) {
      return res.status(404).json({ message: "Receiver not found" });
    }
    const { name: receiverName, email: receiverEmail } = receiverResult.rows[0];

    // Fetch group name (optional)
    const groupResult = await pool.query('SELECT name FROM groups WHERE id = $1', [groupId]);
    const groupName = groupResult.rows[0]?.name || 'your group';

    // Compose email
    const subject = `💰 Payment Reminder from ${senderName}`;
    const body = `
Hi ${receiverName},

This is a friendly reminder from ${senderName} regarding your pending payment in the group ${groupName}.

You owe: ₹${amount}

Please make the payment at your earliest convenience.

Thanks,  
Expense Tracker App
    `;

    // Send email
    await sendEmail(receiverEmail, subject, body);

    res.json({ message: "Payment reminder sent successfully" });
  } catch (err) {
    next(err);
  }
};

exports.getMyRecurringContributions = async (req, res, next) => {
  const userId = req.user.id;

  // Function to compute the next date based on frequency and start date
  const computeNextDate = (startDate, frequency) => {
    const now = new Date();
    const start = new Date(startDate);
    let next = new Date(start);

    while (next <= now) {
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      return null; // unknown frequency
  }
}

    return next.toISOString().split('T')[0]; // format as yyyy-mm-dd
  };

  try {
    const result = await pool.query(
      `SELECT 
        rc.*,
        u.name AS contributor_name,
        g.name AS group_name,
        array_agg(DISTINCT gm_u.name) AS participants
      FROM recurring_contributions rc
      JOIN users u ON rc.user_id = u.id
      JOIN groups g ON rc.group_id = g.id
      LEFT JOIN group_members gm ON rc.group_id = gm.group_id
      LEFT JOIN users gm_u ON gm.user_id = gm_u.id
      WHERE rc.group_id IN (
        SELECT group_id FROM group_members WHERE user_id = $1
      )
      GROUP BY rc.id, u.name, g.name
      ORDER BY rc.start_date DESC;
    `,
      [userId]
    );

    // Enhance rows with next_date
    const contributions = result.rows.map((c) => ({
      ...c,
      next_date: computeNextDate(c.start_date, c.frequency),
    }));

    res.status(200).json({ contributions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch recurring contributions' });
  }
};
