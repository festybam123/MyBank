import db from '../db.js';

export const nameEnquiry = async (req, res) => {
  const { account_number } = req.body;
  if (!account_number) return res.status(400).json({ error: 'Account number required' });
  try {
    const result = await db.get('SELECT c.name FROM accounts a JOIN customers c ON a.customer_id = c.id WHERE a.account_number = ?', [account_number]);
    if (!result) return res.status(404).json({ error: 'Account not found' });
    res.json({ name: result.name });
  } catch (err) {
    res.status(500).json({ error: 'Name enquiry failed' });
  }
};

export const getBalance = async (req, res) => {
  try {
    const result = await db.get('SELECT balance FROM accounts WHERE customer_id = ?', [req.user.id]);
    if (!result) return res.status(404).json({ error: 'No account found' });
    res.json({ balance: result.balance });
  } catch (err) {
    res.status(500).json({ error: 'Balance check failed' });
  }
};

export const getTransactionStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.get('SELECT * FROM transactions WHERE id = ?', [id]);
    if (!result) return res.status(404).json({ error: 'Transaction not found' });
    const account = await db.get('SELECT * FROM accounts WHERE customer_id = ?', [req.user.id]);
    if (!account || result.account_id !== account.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json({ transaction: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const account = await db.get('SELECT * FROM accounts WHERE customer_id = ?', [req.user.id]);
    if (!account) return res.status(404).json({ error: 'No account found' });
    const txs = await db.all('SELECT * FROM transactions WHERE account_id = ? ORDER BY created_at DESC', [account.id]);
    res.json({ transactions: txs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

export const transfer = async (req, res) => {
  const { to_account, amount, description } = req.body;
  if (!to_account || !amount) return res.status(400).json({ error: 'to_account and amount required' });
  if (amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  try {
    const sender = await db.get('SELECT * FROM accounts WHERE customer_id = ?', [req.user.id]);
    if (!sender) return res.status(404).json({ error: 'Sender account not found' });
    if (sender.balance < amount) return res.status(400).json({ error: 'Insufficient funds' });
    const recipient = await db.get('SELECT * FROM accounts WHERE account_number = ?', [to_account]);
    if (!recipient) return res.status(404).json({ error: 'Recipient not found' });
    
    await db.run('UPDATE accounts SET balance = balance - ? WHERE id = ?', [amount, sender.id]);
    await db.run('UPDATE accounts SET balance = balance + ? WHERE id = ?', [amount, recipient.id]);
    const tx1 = await db.run('INSERT INTO transactions (account_id, type, amount, description, status, recipient_account) VALUES (?, ?, ?, ?, ?, ?)', [sender.id, 'debit', amount, description || '', 'success', to_account]);
    await db.run('INSERT INTO transactions (account_id, type, amount, description, status, recipient_account) VALUES (?, ?, ?, ?, ?, ?)', [recipient.id, 'credit', amount, description || '', 'success', sender.account_number]);
    res.json({ transaction: { id: tx1.lastID, account_id: sender.id, type: 'debit', amount, description: description || '', status: 'success', recipient_account: to_account } });
  } catch (err) {
    res.status(500).json({ error: 'Transfer failed' });
  }
};