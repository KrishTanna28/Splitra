const cron = require('node-cron');
const pool = require('../config/db');
const sendMail = require('../utils/mailer');

// Runs every day at 8AM
cron.schedule('0 0 1 * *', async () => {
  console.log('⏰ [REMINDER] Running daily due reminders...');

  try {
    const groupBalances = await pool.query(`
      SELECT g.id AS group_id, g.name AS group_name, u.id AS user_id, u.name, u.email, e.paid_by AS paid_by,SUM(es.amount) AS total_due
      FROM expenses e
      JOIN expense_shares es ON e.id = es.expense_id
      JOIN groups g ON g.id = e.group_id
      JOIN users u ON es.user_id = u.id
      WHERE es.user_id != e.paid_by_id
      GROUP BY g.id, u.id, u.name, u.email, e.paid_by
      HAVING SUM(es.amount) > 0
    `);

    for (const row of groupBalances.rows) {
      const message = `Hello ${row.name},\n\nYou owe ₹${row.total_due} to ${row.paid_by} in ${row.group_name}.\nPlease settle it as soon as possible.\n\n\n\nThanks,  
Team Splitra.`;

      // Send email or console log
      if (row.email) {
        await sendMail(row.email, '🧾 Splitra Reminder', message);
      } else {
        console.log(`[Reminder] ${row.name}: ₹${row.total_due} in group ${row.group_id}`);
      }
    }

    console.log('✅ Reminder check done.');
  } catch (err) {
    console.error('❌ Reminder error:', err.message);
  }
});
