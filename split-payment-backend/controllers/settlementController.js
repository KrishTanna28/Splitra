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
      `SELECT s.*, u1.name as from_name, u2.name as to_name
       FROM settlements s
       JOIN users u1 ON s.paid_by = u1.id
       JOIN users u2 ON s.paid_to = u2.id
       WHERE s.group_id = $1
       ORDER BY s.created_at DESC`,
      [groupId]
    );

    res.json({ settlements: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.addRecurringContribution = async (req, res, next) => {
  const userId = req.user.id;
  const groupId = req.params.groupId;
  const { amount, startDate, frequency, description , category} = req.body;

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

    res.status(201).json({ message: 'Recurring contribution added and notifications sent' });
  } catch (err) {
    next(err);
  }
};

