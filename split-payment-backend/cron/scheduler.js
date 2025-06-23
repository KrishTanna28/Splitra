const cron = require('node-cron');
const pool = require('../config/db');

// Runs at 00:00 on 1st of every month
cron.schedule('0 0 1 * *', async () => {
  console.log('⏳ Running auto-settlement scheduler...');

  const today = new Date().toISOString().split('T')[0];

  const query = `
    SELECT * FROM recurring_contributions
    WHERE active = true AND start_date <= $1
  `;

  const result = await pool.query(query, [today]);

  for (const rc of result.rows) {
    await pool.query(
      `INSERT INTO settlements (group_id, paid_by, paid_to, amount, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [rc.group_id, rc.user_id, 0, rc.amount, 'Auto Monthly Contribution']
    );
  }

  console.log('✅ Auto-settlements inserted.');
});
