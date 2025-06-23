const pool = require('../config/db');
const QRCode = require('qrcode');

exports.generateUPIQRCode = async (req, res) => {
  const { upiId, name, amount } = req.query;

  if (!upiId || !name || !amount) {
    return res.status(400).json({ message: 'upiId, name, and amount are required' });
  }

  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;

  try {
    const qr = await QRCode.toDataURL(upiUrl);
    res.json({ upiUrl, qrCode: qr });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate QR code' });
  }
};


// Record a manual settlement
exports.addSettlement = async (req, res, next) => {
  const { groupId, paidBy, paidTo, amount, note } = req.body;

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

exports.generateUPILink = (req, res) => {
  const { upiId, name, amount } = req.query;

  if (!upiId || !name || !amount) {
    return res.status(400).json({ message: 'upiId, name, and amount are required' });
  }

  const link = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;

  res.json({ link });
};

exports.addRecurringContribution = async (req, res, next) => {
  const { groupId, userId, amount, startDate, frequency } = req.body;

  if (!groupId || !userId || !amount || !startDate) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    await pool.query(
      `INSERT INTO recurring_contributions (group_id, user_id, amount, start_date, frequency)
       VALUES ($1, $2, $3, $4, $5)`,
      [groupId, userId, amount, startDate, frequency || 'monthly']
    );

    res.status(201).json({ message: 'Recurring contribution added' });
  } catch (err) {
    next(err);
  }
};
