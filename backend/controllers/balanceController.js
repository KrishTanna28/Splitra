const pool = require('../config/db');
const { minimizeTransactions } = require('../utils/optimizer');

exports.getGroupBalances = async (req, res, next) => {
    const { groupId } = req.params;

    try {
        // Get user IDs and names in group
        const usersResult = await pool.query(
            `SELECT u.id AS user_id, u.name
             FROM users u
             JOIN group_members gm ON gm.user_id = u.id
             WHERE gm.group_id = $1`,
            [groupId]
        );

        const userIdNameMap = {};
        const balances = {};

        for (const row of usersResult.rows) {
            userIdNameMap[row.user_id] = row.name;
            balances[row.user_id] = 0;
        }

        // Total paid per user
        const paidResult = await pool.query(
            `SELECT paid_by_id as user_id, SUM(amount) as total_paid
             FROM expenses
             WHERE group_id = $1
             GROUP BY paid_by_id`,
            [groupId]
        );

        for (const row of paidResult.rows) {
            balances[row.user_id] = parseFloat(row.total_paid);
        }

        // Total owed per user
        const owedResult = await pool.query(
            `SELECT es.user_id, SUM(es.amount) as total_owed
             FROM expense_shares es
             JOIN expenses e ON e.id = es.expense_id
             WHERE e.group_id = $1
             GROUP BY es.user_id`,
            [groupId]
        );

        for (const row of owedResult.rows) {
            balances[row.user_id] = (balances[row.user_id] || 0) - parseFloat(row.total_owed);
        }

        // Settlements: paid_by loses, paid_to gains
        const settlementsResult = await pool.query(
            `SELECT 
     s.paid_by,
     s.paid_to,
     s.amount,
     u1.name AS paid_by_name,
     u2.name AS paid_to_name
   FROM settlements s
   JOIN users u1 ON s.paid_by = u1.id
   JOIN users u2 ON s.paid_to = u2.id
   WHERE s.group_id = $1`,
            [groupId]
        );


        for (const row of settlementsResult.rows) {
            const from = row.paid_by;
            const to = row.paid_to;
            const amt = parseFloat(row.amount);

            balances[from] = (balances[from] || 0) - amt;
            balances[to] = (balances[to] || 0) + amt;
        }

        // Format balances with name + id
        const finalBalances = Object.entries(balances).map(([userId, amount]) => ({
            id: userId,
            name: userIdNameMap[userId],
            balance: amount
        }));

        // Optimize transactions
        const optimized = minimizeTransactions(balances);

        const optimizedWithNames = optimized.map((s) => ({
            amount: s.amount,
            from: {
                id: s.from,
                name: userIdNameMap[s.from],
            },
            to: {
                id: s.to,
                name: userIdNameMap[s.to],
            },
        }));

        res.json({ balances: finalBalances, settlements: optimizedWithNames });

    } catch (err) {
        next(err);
    }
};

exports.getMyBalances = async (req, res, next) => {
    const userId = req.user.id;  // from auth middleware
    const { groupId } = req.params;

    try {
        // Get total amount paid by the user in the group
        const paidResult = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total_paid
             FROM expenses
             WHERE group_id = $1 AND paid_by_id = $2`,
            [groupId, userId]
        );
        const totalPaid = parseFloat(paidResult.rows[0].total_paid);

        // Get total amount owed by the user in the group
        const owedResult = await pool.query(
            `SELECT COALESCE(SUM(es.amount), 0) as total_owed
             FROM expense_shares es
             JOIN expenses e ON e.id = es.expense_id
             WHERE e.group_id = $1 AND es.user_id = $2`,
            [groupId, userId]
        );
        const totalOwed = parseFloat(owedResult.rows[0].total_owed);

        // Get net settlement amounts (paid_by = user => negative, paid_to = user => positive)
        const settlementsResult = await pool.query(
            `SELECT
                COALESCE(SUM(CASE WHEN paid_by = $2 THEN -amount ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN paid_to = $2 THEN amount ELSE 0 END), 0)
             AS net_settled
             FROM settlements
             WHERE group_id = $1`,
            [groupId, userId]
        );
        const netSettled = parseFloat(settlementsResult.rows[0].net_settled);

        // Final balance
        let finalBalance = totalPaid - totalOwed + netSettled;

        if (Object.is(finalBalance, -0) || Math.abs(finalBalance) < 0.01) {
            finalBalance = 0;
        }

        res.json({
            userId,
            groupId,
            totalPaid,
            totalOwed,
            netSettled,
            finalBalance, // positive => user is owed, negative => user owes
        });
    } catch (err) {
        next(err);
    }
};
