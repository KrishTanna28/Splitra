const pool = require('../config/db');

exports.createGroup = async (req, res, next) => {
  const { name, description } = req.body;
  const userId = req.user.id;

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const username = userResult.rows[0].name;
    const groupResult = await pool.query(
      'INSERT INTO groups (name, description, created_by_id, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, userId, username]
    );
    const groupId = groupResult.rows[0].id;
    // Make creator an Admin in group_members
    await pool.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
      [groupId, userId]
    );

    res.status(201).json({ message: 'Group created', group: groupResult.rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.getUserGroups = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT g.*
       FROM groups g
       JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = $1`,
      [userId]
    );

    res.json({ groups: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.addMember = async (req, res, next) => {
  const groupId = req.params.groupId;
  const { userEmail } = req.body;
  const requesterId = req.user.id;

  try {
    // Check if user exists
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [userEmail]);
    if (!userResult.rows[0]) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userId = userResult.rows[0].id;
    const userName = userResult.rows[0].name;

    // Check if user is already a member
    const memberCheck = await pool.query(
      'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );
    if (memberCheck.rows.length > 0) {
      return res.status(400).json({ message: 'User is already a member of this group' });
    }

    // Add member
    await pool.query(
      'INSERT INTO group_members (group_id, user_email, user_id) VALUES ($1, $2, $3)',
      [groupId, userEmail, userId]
    );

    // Fetch group name and requester name
    const groupResult = await pool.query('SELECT name FROM groups WHERE id = $1', [groupId]);
    const groupName = groupResult.rows[0]?.name || 'your group';

    const requesterResult = await pool.query('SELECT name FROM users WHERE id = $1', [requesterId]);
    const addedBy = requesterResult.rows[0]?.name || 'Someone';

    // Send email notification
    const subject = `🎉 You've been added to a group: ${groupName}`;
    const body = `
Hi ${userName},

You’ve been added to the group **${groupName}** by ${addedBy}.

You can now collaborate, track expenses, and manage activities within this group.

Best regards,  
Expense Tracker App
    `;

    await sendEmail(userEmail, subject, body);

    res.json({ message: 'Member added and email sent' });
  } catch (err) {
    next(err);
  }
};


exports.removeMember = async (req, res, next) => {
  const groupId = req.params.groupId;
  const userId = req.user.id;

  try {
    // 1. Get total amount paid by the user
    const paidResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total_paid
       FROM expenses
       WHERE group_id = $1 AND paid_by_id = $2`,
      [groupId, userId]
    );
    const totalPaid = parseFloat(paidResult.rows[0].total_paid);

    // 2. Get total amount owed by the user
    const owedResult = await pool.query(
      `SELECT COALESCE(SUM(es.amount), 0) as total_owed
       FROM expense_shares es
       JOIN expenses e ON e.id = es.expense_id
       WHERE e.group_id = $1 AND es.user_id = $2`,
      [groupId, userId]
    );
    const totalOwed = parseFloat(owedResult.rows[0].total_owed);

    // 3. Get net settlement involving the user
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

    // 4. Calculate final balance
    let finalBalance = totalPaid - totalOwed + netSettled;

    if (Object.is(finalBalance, -0) || Math.abs(finalBalance) < 0.01) {
      finalBalance = 0;
    }

    if (finalBalance !== 0) {
      return res.status(400).json({
        message: "You cannot leave the group unless your balance is fully settled (₹0).",
        finalBalance
      });
    }

    // 5. Delete the member from group
    await pool.query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );

    res.json({ message: 'Member removed successfully' });

  } catch (err) {
    next(err);
  }
};

exports.getGroupMembers = async (req, res, next) => {
  const { groupId } = req.params;

  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = $1`,
      [groupId]
    );

    res.json({ members: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.getGroupMemberCount = async (req, res, next) => {
  const { groupId } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM group_with_member_count WHERE id = $1`,
      [groupId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

