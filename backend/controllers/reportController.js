const pool = require('../config/db');

const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

exports.exportExpensesCSV = async (req, res, next) => {
  const { groupId } = req.params;

  try {
    const result = await pool.query(
      `SELECT e.id, u.name AS paid_by, e.amount, e.category, e.description, e.created_at
       FROM expenses e
       JOIN users u ON e.paid_by_id = u.id
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
    // Get group details
    const groupResult = await pool.query('SELECT name FROM groups WHERE id = $1', [groupId]);
    const groupName = groupResult.rows[0]?.name || 'Unknown Group';

    const result = await pool.query(
      `SELECT e.id, u.name AS paid_by, e.amount, e.category, e.description, e.created_at
       FROM expenses e
       JOIN users u ON e.paid_by_id = u.id
       WHERE e.group_id = $1
       ORDER BY e.created_at DESC`,
      [groupId]
    );

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${groupName.replace(/\s+/g, '_')}_expenses.pdf`);

    doc.pipe(res);

    // Header
    const options = {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };

    const dateOptions = {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "short",
      day: "numeric",
    };

    const generatedDate = new Date().toLocaleDateString("en-IN", dateOptions);
    const generatedTime = new Date().toLocaleTimeString("en-IN", options);

    doc.fontSize(24).font("Helvetica-Bold").text("EXPENSE RECEIPT", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(16).font("Helvetica").text(groupName, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(12).font("Helvetica").text(`Generated on: ${generatedDate} at ${generatedTime}`, { align: "center" });

    doc.moveDown(2);

    // Summary
    const totalAmount = result.rows.reduce((sum, row) => sum + parseFloat(row.amount), 0);
    const totalExpenses = result.rows.length;

    doc.fontSize(14).font('Helvetica-Bold').text('SUMMARY', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(`Total Expenses: ${totalExpenses}`);
    doc.fontSize(12).font('Helvetica').text(`Total Amount: ₹${totalAmount.toFixed(2)}`);
    doc.moveDown(1);

    // Table Header
    doc.fontSize(12).font('Helvetica-Bold');
    const tableTop = doc.y;
    const colWidths = [50, 120, 80, 100, 80];
    const startX = 50;

    // Draw table header
    doc.text('S.No', startX, tableTop);
    doc.text('Description', startX + colWidths[0], tableTop);
    doc.text('Category', startX + colWidths[0] + colWidths[1], tableTop);
    doc.text('Paid By', startX + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
    doc.text('Amount', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop);

    // Draw header line
    doc.moveTo(startX, tableTop + 15).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), tableTop + 15).stroke();
    doc.moveDown(0.5);

    // Table content
    doc.fontSize(10).font('Helvetica');
    result.rows.forEach((exp, index) => {
      const rowY = doc.y;

      // Check if we need a new page
      if (rowY > 700) {
        doc.addPage();
        doc.fontSize(12).font('Helvetica-Bold').text('EXPENSE RECEIPT (Continued)', { align: 'center' });
        doc.moveDown(2);
      }

      doc.text((index + 1).toString(), startX, doc.y);
      doc.text(exp.description || 'N/A', startX + colWidths[0], doc.y);
      doc.text(exp.category || 'N/A', startX + colWidths[0] + colWidths[1], doc.y);
      doc.text(exp.paid_by, startX + colWidths[0] + colWidths[1] + colWidths[2], doc.y);
      doc.text(`₹${parseFloat(exp.amount).toFixed(2)}`, startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], doc.y);

      doc.moveDown(0.5);
    });

    // Draw bottom line
    const bottomY = doc.y;
    doc.moveTo(startX, bottomY).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), bottomY).stroke();
    doc.moveDown(1);

    // Footer
    doc.fontSize(12).font('Helvetica-Bold').text('TOTAL:', { align: 'right' });
    doc.fontSize(14).font('Helvetica-Bold').text(`₹${totalAmount.toFixed(2)}`, { align: 'right' });
    doc.moveDown(2);

    // Additional details
    doc.fontSize(10).font('Helvetica').text('Notes:', { underline: true });
    doc.fontSize(10).font('Helvetica').text('• This is an automatically generated expense report');
    doc.fontSize(10).font('Helvetica').text('• All amounts are in Indian Rupees (₹)');
    doc.fontSize(10).font('Helvetica').text('• For any discrepancies, please contact the group administrator');
    doc.moveDown(1);

    // Footer line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(8).font('Helvetica').text('Generated by Split Payment App', { align: 'center' });

    doc.end();
  } catch (err) {
    next(err);
  }
};


exports.getMonthlySummary = async (req, res, next) => {
  const { groupId, month, year } = req.query;
  const userId = req.user.id;

  if (!groupId || !month || !year || !userId) {
    return res.status(400).json({ message: 'groupId, month, year, and userId are required' });
  }

  const groupIdInt = parseInt(groupId);
  const monthInt = parseInt(month);
  const yearInt = parseInt(year);
  const userIdInt = parseInt(userId);

  if (
    isNaN(groupIdInt) || isNaN(monthInt) || isNaN(yearInt) || isNaN(userIdInt) ||
    monthInt < 1 || monthInt > 12
  ) {
    return res.status(400).json({ message: 'Invalid groupId, month, year, or userId' });
  }

  try {
    // 1. Top Contributors + Total
    const contributorsResult = await pool.query(`
      SELECT 
        u.name,
        e.paid_by_id,
        SUM(e.amount) as total_paid
      FROM expenses e
      JOIN users u ON e.paid_by_id = u.id
      WHERE e.group_id = $1 AND EXTRACT(MONTH FROM e.created_at) = $2 AND EXTRACT(YEAR FROM e.created_at) = $3
      GROUP BY e.paid_by_id, u.name
      ORDER BY total_paid DESC
    `, [groupIdInt, monthInt, yearInt]);

    const totalSpending = contributorsResult.rows.reduce((sum, row) => sum + parseFloat(row.total_paid), 0);

    // 2. Average per person
    const memberCountResult = await pool.query(`
      SELECT COUNT(*) FROM group_members WHERE group_id = $1
    `, [groupIdInt]);
    const memberCount = parseInt(memberCountResult.rows[0].count);
    const averagePerPerson = totalSpending / (memberCount || 1);

    // 3. Top Category
    const categoryResult = await pool.query(`
      SELECT category, SUM(amount) as total
      FROM expenses
      WHERE group_id = $1 AND EXTRACT(MONTH FROM created_at) = $2 AND EXTRACT(YEAR FROM created_at) = $3
      GROUP BY category
      ORDER BY total DESC
      LIMIT 1
    `, [groupIdInt, monthInt, yearInt]);

    const topCategory = categoryResult.rows[0] || null;

    // 4. Your Contribution
    const yourContributionResult = await pool.query(`
      SELECT SUM(amount) as total
      FROM expenses
      WHERE group_id = $1 AND paid_by_id = $2 AND EXTRACT(MONTH FROM created_at) = $3 AND EXTRACT(YEAR FROM created_at) = $4
    `, [groupIdInt, userIdInt, monthInt, yearInt]);
    const yourContribution = parseFloat(yourContributionResult.rows[0].total || 0);

    // 5. Total Settlements
    const settlementResult = await pool.query(`
      SELECT SUM(amount) as total
      FROM settlements
      WHERE group_id = $1 AND EXTRACT(MONTH FROM created_at) = $2 AND EXTRACT(YEAR FROM created_at) = $3
    `, [groupIdInt, monthInt, yearInt]);
    const totalSettlements = parseFloat(settlementResult.rows[0].total || 0);

    // 6. Last 3 Months Breakdown
    const last3MonthsResult = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'Month') AS month,
        EXTRACT(MONTH FROM created_at)::int as month_num,
        EXTRACT(YEAR FROM created_at)::int as year,
        SUM(amount) as total
      FROM expenses
      WHERE group_id = $1 AND created_at >= (CURRENT_DATE - INTERVAL '6 months')
      GROUP BY month, month_num, year
      ORDER BY year DESC, month_num DESC
      LIMIT 3
    `, [groupIdInt]);

    const last3Months = last3MonthsResult.rows.map(row => ({
      month: row.month.trim(),
      year: row.year,
      total: parseFloat(row.total)
    }));

    // Final Response
    res.json({
      totalSpending: +totalSpending.toFixed(2),
      averagePerPerson: +averagePerPerson.toFixed(2),
      topContributors: contributorsResult.rows,
      topCategory,
      yourContribution: +yourContribution.toFixed(2),
      totalSettlements: +totalSettlements.toFixed(2),
      last3Months
    });

  } catch (err) {
    next(err);
  }
};

exports.getExpenseInsights = async (req, res, next) => {
  const { groupId } = req.query;

  if (!groupId) {
    return res.status(400).json({ message: "groupId is required" });
  }

  try {
    const monthlySpending = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'Month') AS month,
        EXTRACT(MONTH FROM created_at) AS month_num,
        EXTRACT(YEAR FROM created_at) AS year,
        SUM(amount) AS total
      FROM expenses
      WHERE group_id = $1 AND created_at >= (CURRENT_DATE - INTERVAL '6 months')
      GROUP BY month, month_num, year
      ORDER BY year, month_num
    `, [groupId]);

    const contributionBreakdown = await pool.query(`
      SELECT 
        u.name,
        SUM(e.amount) AS total
      FROM expenses e
      JOIN users u ON e.paid_by_id = u.id
      WHERE e.group_id = $1 AND EXTRACT(MONTH FROM e.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM e.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
      GROUP BY u.name
    `, [groupId]);

    const categorySpending = await pool.query(`
      SELECT 
        TO_CHAR(e.created_at, 'Month') AS month,
        e.category,
        SUM(e.amount) AS total
      FROM expenses e
      WHERE e.group_id = $1 AND created_at >= (CURRENT_DATE - INTERVAL '3 months')
      GROUP BY month, e.category
      ORDER BY month
    `, [groupId]);

    res.json({
      monthlySpending: monthlySpending.rows,
      contributionBreakdown: contributionBreakdown.rows,
      categorySpending: categorySpending.rows
    });

  } catch (err) {
    next(err);
  }
};
