const pool = require('../config/db');
const { minimizeTransactions } = require('../utils/optimizer');

exports.getGroupBalances = async (req, res, next) => {
    const { groupId } = req.params;

    try {
        // Get total paid per user in group
        const paidResult = await pool.query(
            `SELECT paid_by as user_id, SUM(amount) as total_paid
       FROM expenses
       WHERE group_id = $1
       GROUP BY paid_by`,
            [groupId]
        );

        // Get total owed per user (from shares)
        const owedResult = await pool.query(
            `SELECT es.user_id, SUM(es.amount) as total_owed
       FROM expense_shares es
       JOIN expenses e ON e.id = es.expense_id
       WHERE e.group_id = $1
       GROUP BY es.user_id`,
            [groupId]
        );

        // Map to net balances
        const balances = {};

        for (const row of paidResult.rows) {
            balances[row.user_id] = parseFloat(row.total_paid);
        }

        for (const row of owedResult.rows) {
            balances[row.user_id] = (balances[row.user_id] || 0) - parseFloat(row.total_owed);
        }

        // Optimize transactions
        const optimized = minimizeTransactions(balances);

        // Get total settlements paid and received
        const settlementsResult = await pool.query(
            `SELECT paid_by, paid_to, amount FROM settlements WHERE group_id = $1`,
            [groupId]
        );

        // Update balances: paid_by loses money, paid_to gains money
        for (const row of settlementsResult.rows) {
            const from = row.paid_by;
            const to = row.paid_to;
            const amt = parseFloat(row.amount);

            balances[from] = (balances[from] || 0) - amt;
            balances[to] = (balances[to] || 0) + amt;
        }

        res.json({ balances, settlements: optimized });
    } catch (err) {
        next(err);
    }
};
