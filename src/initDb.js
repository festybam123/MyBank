import db from './db.js';

const createTablesSQL = `
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  bvn VARCHAR(20),
  nin VARCHAR(20),
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER UNIQUE REFERENCES customers(id),
  account_number VARCHAR(20) UNIQUE NOT NULL,
  balance NUMERIC(15,2) DEFAULT 15000.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER REFERENCES accounts(id),
  type VARCHAR(20) NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL,
  recipient_account VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

(async () => {
  try {
    await db.exec(createTablesSQL);
    console.log('Database tables created/verified.');
    process.exit(0);
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
})();