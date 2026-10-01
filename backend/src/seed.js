require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcrypt');
const pool = require('./db/pool');
const { initializeDatabase } = require('./db/schema');

async function seed() {
  await initializeDatabase();

  const defaultPassword = await bcrypt.hash('password123', 10);

  const users = [
    { name: 'HR Admin', employee_id: 'HR-001', email: 'hr@company.com', password_hash: defaultPassword, role: 'HR', department: 'Human Resources', manager_id: null },
    { name: 'Manager One', employee_id: 'MGR-001', email: 'manager1@company.com', password_hash: defaultPassword, role: 'MANAGER', department: 'Operations', manager_id: null },
    { name: 'Manager Two', employee_id: 'MGR-002', email: 'manager2@company.com', password_hash: defaultPassword, role: 'MANAGER', department: 'Operations', manager_id: null },
    { name: 'Employee One', employee_id: 'EMP-001', email: 'employee1@company.com', password_hash: defaultPassword, role: 'EMPLOYEE', department: 'Engineering', manager_id: 2 },
    { name: 'Employee Two', employee_id: 'EMP-002', email: 'employee2@company.com', password_hash: defaultPassword, role: 'EMPLOYEE', department: 'Engineering', manager_id: 2 },
    { name: 'Employee Three', employee_id: 'EMP-003', email: 'employee3@company.com', password_hash: defaultPassword, role: 'EMPLOYEE', department: 'Finance', manager_id: 3 },
    { name: 'Employee Four', employee_id: 'EMP-004', email: 'employee4@company.com', password_hash: defaultPassword, role: 'EMPLOYEE', department: 'Finance', manager_id: 3 },
    { name: 'Employee Five', employee_id: 'EMP-005', email: 'employee5@company.com', password_hash: defaultPassword, role: 'EMPLOYEE', department: 'Support', manager_id: 2 },
  ];

  for (const user of users) {
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [user.email]);
    if (!existing.rows[0]) {
      await pool.query(
        `INSERT INTO users (name, employee_id, email, password_hash, role, department, manager_id, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
        [user.name, user.employee_id, user.email, user.password_hash, user.role, user.department, user.manager_id]
      );
    }
  }

  console.log('Seed complete');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
