const bcrypt = require('bcrypt');
const pool = require('../db/pool');

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      employee_id: user.employee_id,
      department: user.department,
      manager_id: user.manager_id,
    };

    return res.json({ success: true, user: req.session.user });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Unable to login.' });
  }
}

function logout(req, res) {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({ success: false, message: 'Unable to logout.' });
    }
    res.clearCookie('connect.sid');
    return res.json({ success: true, message: 'Logged out successfully.' });
  });
}

function whoAmI(req, res) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  return res.json({ success: true, user: req.session.user });
}

module.exports = { login, logout, whoAmI };
