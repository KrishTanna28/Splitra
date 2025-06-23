const pool = require('../config/db');

const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

exports.exportExpensesCSV = async (req, res, next) => {
  const { groupId } = req.params;

  try {
    const result = await pool.query(
      `SELECT e.id, u.name AS paid_by, e.amount, e.category, e.description, e.created_at
       FROM expenses e
       JOIN users u ON e.paid_by = u.id
       WHERE e.group_id = $1
       ORDER BY e.created_at DESC`,
      [groupId]
    );

    const csv = new Parser().parse(result.rows);
    res.header('Content-Type', 'text/csv');
    res.attachment('expenses.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

exports.exportExpensesPDF = async (req, res, next) => {
  const { groupId } = req.params;

  try {
    const result = await pool.query(
      `SELECT e.id, u.name AS paid_by, e.amount, e.category, e.description, e.created_at
       FROM expenses e
       JOIN users u ON e.paid_by = u.id
       WHERE e.group_id = $1
       ORDER BY e.created_at DESC`,
      [groupId]
    );

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.pdf');

    doc.pipe(res);
    doc.fontSize(16).text('Group Expense Report', { align: 'center' }).moveDown();

    result.rows.forEach((exp) => {
      doc.fontSize(12).text(
        `Paid by: ${exp.paid_by}, ₹${exp.amount}, ${exp.category}, ${exp.description}, ${new Date(exp.created_at).toLocaleDateString()}`
      );
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (err) {
    next(err);
  }
};


exports.getMonthlySummary = async (req, res, next) => {
  const { groupId, month, year } = req.query;

  if (!groupId || !month || !year) {
    return res.status(400).json({ message: 'groupId, month, and year are required' });
  }

  try {
    const result = await pool.query(`
      SELECT 
        u.name,
        e.paid_by,
        SUM(e.amount) as total_paid
      FROM expenses e
      JOIN users u ON e.paid_by = u.id
      WHERE e.group_id = $1 AND EXTRACT(MONTH FROM e.created_at) = $2 AND EXTRACT(YEAR FROM e.created_at) = $3
      GROUP BY e.paid_by, u.name
      ORDER BY total_paid DESC
    `, [groupId, month, year]);

    const totalSpending = result.rows.reduce((sum, row) => sum + parseFloat(row.total_paid), 0);

    res.json({
      totalSpending: +totalSpending.toFixed(2),
      topContributors: result.rows
    });
  } catch (err) {
    next(err);
  }
};
