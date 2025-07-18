const cron = require('node-cron');
const pool = require('../config/db');
const sendMail = require('../utils/mailer');

// Runs every day at 8AM
cron.schedule('0 8 * * *', async () => {
  console.log('⏰ [REMINDER] Running daily due reminders...');

  try {
    const groupBalances = await pool.query(`
      SELECT g.id AS group_id, u.id AS user_id, u.name, u.email, SUM(es.amount) AS total_due
      FROM expenses e
      JOIN expense_shares es ON e.id = es.expense_id
      JOIN groups g ON g.id = e.group_id
      JOIN users u ON es.user_id = u.id
      WHERE es.user_id != e.paid_by_id
      GROUP BY g.id, u.id, u.name, u.email
      HAVING SUM(es.amount) > 0
    `);

    for (const row of groupBalances.rows) {
      const message = `Hello ${row.name},\n\nYou owe ₹${row.total_due} in Group ID ${row.group_id}.\nPlease settle it as soon as possible.`;

      // Send email or console log
      if (row.email) {
        await sendMail(row.email, '🧾 Split Payment Reminder', message);
      } else {
        console.log(`[Reminder] ${row.name}: ₹${row.total_due} in Group ${row.group_id}`);
      }
    }

    console.log('✅ Reminder check done.');
  } catch (err) {
    console.error('❌ Reminder error:', err.message);
  }
});
