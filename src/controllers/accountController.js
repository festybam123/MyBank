import db from '../db.js';
import { generateAccountNumber } from '../utils/accountNumber.js';

export const createAccount = async (req, res) => {
  try {
    const existing = await db.get('SELECT * FROM accounts WHERE customer_id = ?', [req.user.id]);
    if (existing) {
      return res.status(409).json({ error: 'Account already exists' });
    }
    const account_number = generateAccountNumber();
    const result = await db.run(
      'INSERT INTO accounts (customer_id, account_number, balance) VALUES (?, ?, 15000)',
      [req.user.id, account_number]
    );
    res.json({ account: { id: result.lastID, customer_id: req.user.id, account_number, balance: 15000 } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create account' });
  }
};

export const getAccount = async (req, res) => {
  try {
    const result = await db.get(
      'SELECT a.*, c.name FROM accounts a JOIN customers c ON a.customer_id = c.id WHERE a.customer_id = ?',
      [req.user.id]
    );
    if (!result) return res.status(404).json({ error: 'No account found' });
    res.json({ account: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch account' });
  }
};