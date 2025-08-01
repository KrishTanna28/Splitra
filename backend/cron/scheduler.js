const cron = require('node-cron');
const pool = require('../config/db');
const sendEmail = require("../utils/mailer");

// 🕐 Run every day at midnight
cron.schedule('* * * * *', async () => {
  console.log('⏳ Running auto-recurring-expense scheduler...');

  const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
  const todayDate = new Date(today);

  try {

    await pool.query(`DELETE FROM groups g
WHERE NOT EXISTS (
  SELECT 1
  FROM group_members gm
  WHERE gm.group_id = g.id
)
      `)

    const query = `
      SELECT * FROM recurring_contributions
      WHERE active = true AND start_date <= $1
    `;
    const result = await pool.query(query, [today]);

    for (const rc of result.rows) {
      const { id, group_id, user_id, amount, frequency, description, category, start_date } = rc;

      // Check if today matches the frequency
      if (!shouldApplyToday(start_date, frequency, todayDate)) continue;

      // Get group name
      const groupRes = await pool.query(`SELECT name FROM groups WHERE id = $1`, [group_id]);
      const groupName = groupRes.rows[0]?.name || 'Your Group';

      const userNameRes = await pool.query(`SELECT name FROM users WHERE id = $1`, [user_id]);
      const userName = userNameRes.rows[0]?.name || "Unknown";

      // Get members
      const membersRes = await pool.query(`
        SELECT u.id, u.name, u.email FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = $1
      `, [group_id]);
      const members = membersRes.rows;

      if (members.length === 0) continue;

      const shareAmount = amount / members.length;

      // 1. Insert into expenses
      const expenseRes = await pool.query(`
        INSERT INTO expenses (group_id, paid_by_id, paid_by, amount, description, category, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id
      `, [
        group_id,
        user_id,
        userName,
        amount,
        description,
        category
      ]);

      const expenseId = expenseRes.rows[0].id;

      // 2. Insert into expense_shares and send emails
      for (let member of members) {
        await pool.query(
          `INSERT INTO expense_shares (expense_id, user_id, amount)
           VALUES ($1, $2, $3)`,
          [expenseId, member.id, shareAmount]
        );

        const subject = `💸 Recurring Contribution Added in ${groupName}`;
        const body = `
Hi ${member.name},

A recurring contribution was added in ${groupName}.

🧾 Description: ${description}
💰 Total Amount: ₹${amount}
🧍 Your Share: ₹${shareAmount.toFixed(2)}



Thanks,  
Team Splitra
        `;
        await sendEmail(member.email, subject, body);
      }
    }

    console.log('✅ Auto-expenses from recurring contributions inserted.');
  } catch (err) {
    console.error('❌ Error running recurring contribution cron:', err.message);
  }
});

// ✅ Frequency matcher
function shouldApplyToday(startDateStr, frequency, todayDate) {
  const startDate = new Date(startDateStr);

  switch (frequency) {
    case 'daily':
      return true;

    case 'weekly':
      // Match day of the week (0-6)
      return startDate.getDay() === todayDate.getDay();

    case 'monthly':
      // Match day of the month (1-31)
      return startDate.getDate() === todayDate.getDate();

    case 'quarterly': {
      const startMonth = startDate.getMonth(); // 0-11
      const todayMonth = todayDate.getMonth();
      const monthsDiff = (todayDate.getFullYear() - startDate.getFullYear()) * 12 + (todayMonth - startMonth);
      return monthsDiff % 3 === 0 && startDate.getDate() === todayDate.getDate();
    }

    case 'yearly':
      return (
        startDate.getDate() === todayDate.getDate() &&
        startDate.getMonth() === todayDate.getMonth()
      );

    default:
      return false; // Unknown frequency
  }
}
