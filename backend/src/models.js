// User, Account, and Transaction models (SQL table creation helpers)

export const createTablesSQL = `
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  bvn VARCHAR(20),
  nin VARCHAR(20),
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) UNIQUE,
  account_number VARCHAR(20) UNIQUE NOT NULL,
  balance NUMERIC(15,2) DEFAULT 15000.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id),
  type VARCHAR(20) NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL,
  recipient_account VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;
