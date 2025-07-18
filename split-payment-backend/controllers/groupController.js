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
      'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)',
      [groupId, userId, 'Admin']
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
  const { userEmail, role } = req.body;
  const requesterId = req.user.id;

  try {
    // Ensure requester is Admin
    const check = await pool.query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, requesterId]
    );
    if (check.rows[0]?.role !== 'Admin') {
      return res.status(403).json({ message: 'Only Admins can add members' });
    }

    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [userEmail]);
    if(!userResult.rows[0]){
      res.status(404).json({message:"User not found"});
    }
    const userId = userResult.rows[0].id;
    // Add member
    await pool.query(
      'INSERT INTO group_members (group_id, user_email, role, user_id) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      [groupId, userEmail, role, userId]
    );
    res.json({ message: 'Member added'});
  } catch (err) {
    next(err);
  }
};

exports.removeMember = async (req, res, next) => {
  const groupId = req.params.groupId;
  const userId = req.params.id;
  const requesterId = req.user.id;

  try {
    const check = await pool.query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, requesterId]
    );
    if (check.rows[0]?.role !== 'Admin') {
      return res.status(403).json({ message: 'Only Admins can remove members' });
    }

    await pool.query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );

    res.json({ message: 'Member removed' });
  } catch (err) {
    next(err);
  }
};

exports.getGroupMembers = async (req, res, next) => {
  const { groupId } = req.params;

  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, gm.role
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
