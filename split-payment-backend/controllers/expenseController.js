const pool = require('../config/db');
const triggerWebhook = require('../utils/webhook');

// Create expense and split logic
exports.addExpense = async (req, res, next) => {
  try {
    if (!req.body.data) {
      return res.status(400).json({ message: 'Missing expense data in form-data field `data`.' });
    }

    const { groupId, paidBy, amount, category, description, splits } = JSON.parse(req.body.data);
    const receiptUrl = req.file ? req.file.path : null;

    await triggerWebhook('https://webhook.site/baac3d72-a8ea-4790-a91e-abaf73141ee8', {
        event: 'expense_created',
        groupId,
        paidBy,
        amount
    });

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const budgetResult = await pool.query(`
  SELECT monthly_limit FROM group_budgets
  WHERE group_id = $1 AND active = true`, [groupId]);

    if (budgetResult.rows.length > 0) {
        const limit = parseFloat(budgetResult.rows[0].monthly_limit);

        const spent = await pool.query(`
    SELECT SUM(amount) FROM expenses
    WHERE group_id = $1 AND EXTRACT(MONTH FROM created_at) = $2 AND EXTRACT(YEAR FROM created_at) = $3
  `, [groupId, month, year]);

        const total = parseFloat(spent.rows[0].sum || 0);

        if (total + parseFloat(amount) > limit) {
            console.warn(`⚠️ Budget exceeded! Limit: ₹${limit}, Total: ₹${total + parseFloat(amount)}`);
            // You can either just warn or block the request here
        }
    }


    try {
        const result = await pool.query(
            `INSERT INTO expenses (group_id, paid_by, amount, category, description, receipt_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
            [groupId, paidBy, amount, category, description, receiptUrl]
        );

        const expenseId = result.rows[0].id;

        for (let share of splits) {
            await pool.query(
                `INSERT INTO expense_shares (expense_id, user_id, amount)
         VALUES ($1, $2, $3)`,
                [expenseId, share.userId, share.amount]
            );
        }

        res.status(201).json({ message: 'Expense created', expenseId });
    } catch (err) {
        next(err);
    }
} catch (err) {
    next(err);
  }
};


// Get expenses in a group with split info
exports.getGroupExpenses = async (req, res, next) => {
    const { groupId } = req.params;
    const { category, minAmount, maxAmount, startDate, endDate } = req.query;

    try {
        let baseQuery = `
      SELECT e.*, u.name as paid_by_name
      FROM expenses e
      JOIN users u ON e.paid_by = u.id
      WHERE e.group_id = $1
    `;
        const values = [groupId];
        let i = 2;

        if (category) {
            baseQuery += ` AND category = $${i++}`;
            values.push(category);
        }
        if (minAmount) {
            baseQuery += ` AND amount >= $${i++}`;
            values.push(minAmount);
        }
        if (maxAmount) {
            baseQuery += ` AND amount <= $${i++}`;
            values.push(maxAmount);
        }
        if (startDate) {
            baseQuery += ` AND created_at >= $${i++}`;
            values.push(startDate);
        }
        if (endDate) {
            baseQuery += ` AND created_at <= $${i++}`;
            values.push(endDate);
        }

        const expenses = await pool.query(baseQuery, values);

        const withSplits = await Promise.all(
            expenses.rows.map(async (exp) => {
                const splits = await pool.query(
                    `SELECT u.name, es.user_id, es.amount
           FROM expense_shares es
           JOIN users u ON es.user_id = u.id
           WHERE es.expense_id = $1`,
                    [exp.id]
                );
                return { ...exp, splits: splits.rows };
            })
        );

        res.json({ expenses: withSplits });
    } catch (err) {
        next(err);
    }
};


exports.deleteExpense = async (req, res, next) => {
    const { expenseId } = req.params;
    const userId = req.user.id;

    try {
        // Get the expense first
        const result = await pool.query(
            `SELECT * FROM expenses WHERE id = $1`,
            [expenseId]
        );

        const expense = result.rows[0];
        if (!expense) return res.status(404).json({ message: 'Expense not found' });

        // Only allow the payer or group admin to delete (optional)
        if (expense.paid_by !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this expense' });
        }

        // 🔒 Check if the expense is older than 7 days
        const isLocked =
            new Date() - new Date(expense.created_at) > 7 * 24 * 60 * 60 * 1000;

        if (isLocked) {
            return res.status(403).json({ message: 'Expense is locked and cannot be deleted' });
        }

        // Delete the expense and associated shares
        await pool.query(`DELETE FROM expense_shares WHERE expense_id = $1`, [expenseId]);
        await pool.query(`DELETE FROM expenses WHERE id = $1`, [expenseId]);

        res.json({ message: 'Expense deleted' });
    } catch (err) {
        next(err);
    }
};

exports.updateExpense = async (req, res, next) => {
    const { expenseId } = req.params;
    const { amount, category, description, splits } = req.body;
    const userId = req.user.id;

    try {
        // Get the expense first
        const result = await pool.query(
            `SELECT * FROM expenses WHERE id = $1`,
            [expenseId]
        );

        const expense = result.rows[0];
        if (!expense) return res.status(404).json({ message: 'Expense not found' });

        // Only allow the payer or group admin to update (optional)
        if (expense.paid_by !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this expense' });
        }

        // 🔒 Check if the expense is older than 7 days
        const isLocked =
            new Date() - new Date(expense.created_at) > 7 * 24 * 60 * 60 * 1000;

        if (isLocked) {
            return res.status(403).json({ message: 'Expense is locked and cannot be updated' });
        }

        // Update the expense
        await pool.query(
            `UPDATE expenses SET amount = $1, category = $2, description = $3
       WHERE id = $4`,
            [amount, category, description, expenseId]
        );

        // Update splits
        await pool.query(`DELETE FROM expense_shares WHERE expense_id = $1`, [expenseId]);

        for (let share of splits) {
            await pool.query(
                `INSERT INTO expense_shares (expense_id, user_id, amount)
         VALUES ($1, $2, $3)`,
                [expenseId, share.userId, share.amount]
            );
        }

        res.json({ message: 'Expense updated' });
    } catch (err) {
        next(err);
    }
}

exports.addComment = async (req, res, next) => {
    const { expenseId } = req.params;
    const { comment, emoji } = req.body;
    const userId = req.user.id;

    try {
        await pool.query(
            `INSERT INTO expense_comments (expense_id, user_id, comment, emoji)
       VALUES ($1, $2, $3, $4)`,
            [expenseId, userId, comment, emoji]
        );

        res.json({ message: 'Comment added' });
    } catch (err) {
        next(err);
    }
};

exports.getComments = async (req, res, next) => {
    const { expenseId } = req.params;

    try {
        const result = await pool.query(
            `SELECT ec.*, u.name FROM expense_comments ec
       JOIN users u ON u.id = ec.user_id
       WHERE expense_id = $1 ORDER BY created_at DESC`,
            [expenseId]
        );

        res.json({ comments: result.rows });
    } catch (err) {
        next(err);
    }
};
