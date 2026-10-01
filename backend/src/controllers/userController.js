const bcrypt = require('bcrypt');
const pool = require('../db/pool');

async function getUsers(req, res) {
  try {
    const result = await pool.query(`
      SELECT u.*, m.name AS manager_name
      FROM users u
      LEFT JOIN users m ON m.id = u.manager_id
      ORDER BY u.id ASC
    `);
    return res.json({ success: true, users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch users.' });
  }
}

async function createUser(req, res) {
  const { name, employee_id, email, department, role, manager_id, password, is_active = true } = req.body;

  if (!name || !employee_id || !email || !department || !role || !password) {
    return res.status(400).json({ success: false, message: 'All required fields are required.' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, employee_id, email, password_hash, role, department, manager_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, email, role, employee_id, department, manager_id, is_active`,
      [name, employee_id, email.toLowerCase(), hashed, role, department, manager_id || null, is_active]
    );

    return res.status(201).json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ success: false, message: 'Unable to create user.' });
  }
}

async function getUserById(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch user.' });
  }
}

async function updateUser(req, res) {
  const { id } = req.params;
  const { name, email, department, role, manager_id, is_active } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           department = COALESCE($3, department),
           role = COALESCE($4, role),
           manager_id = COALESCE($5, manager_id),
           is_active = COALESCE($6, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [name, email ? email.toLowerCase() : null, department, role, manager_id || null, is_active, id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update user.' });
  }
}

module.exports = { getUsers, createUser, getUserById, updateUser };
