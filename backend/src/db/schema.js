const pool = require('./pool');

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      employee_id VARCHAR(100) UNIQUE,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(30) NOT NULL,
      department VARCHAR(255),
      manager_id INTEGER REFERENCES users(id),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cab_requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      travel_date DATE NOT NULL,
      pickup_location VARCHAR(255) NOT NULL,
      destination VARCHAR(255) NOT NULL,
      pickup_time VARCHAR(50) NOT NULL,
      passenger_count INTEGER NOT NULL,
      purpose TEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING_MANAGER_APPROVAL',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS approvals (
      id SERIAL PRIMARY KEY,
      request_id INTEGER NOT NULL REFERENCES cab_requests(id),
      approver_id INTEGER REFERENCES users(id),
      approval_type VARCHAR(20) NOT NULL,
      status VARCHAR(20) NOT NULL,
      rejection_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS car_pools (
      id SERIAL PRIMARY KEY,
      created_by INTEGER NOT NULL REFERENCES users(id),
      travel_date DATE NOT NULL,
      pickup_time VARCHAR(50) NOT NULL,
      destination VARCHAR(255) NOT NULL,
      status VARCHAR(30) DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    ALTER TABLE cab_requests DROP COLUMN IF EXISTS car_id;
    ALTER TABLE car_pools DROP COLUMN IF EXISTS car_id;
    DROP TABLE IF EXISTS drivers;
    DROP TABLE IF EXISTS cars;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS car_pool_members (
      id SERIAL PRIMARY KEY,
      pool_id INTEGER NOT NULL REFERENCES car_pools(id),
      request_id INTEGER NOT NULL UNIQUE REFERENCES cab_requests(id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS session (
      sid VARCHAR(255) NOT NULL PRIMARY KEY,
      sess JSON NOT NULL,
      expire TIMESTAMP(6) NOT NULL
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_cab_requests_user ON cab_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_cab_requests_status ON cab_requests(status);
    CREATE INDEX IF NOT EXISTS idx_users_manager ON users(manager_id);
  `);
}

module.exports = { initializeDatabase };
