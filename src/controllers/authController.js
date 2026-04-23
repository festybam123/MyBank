import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { verifyBVN, verifyNIN } from '../services/nibss.js';

export const register = async (req, res) => {
  const { name, email, password, bvn, nin } = req.body;
  if (bvn) {
    const result = await verifyBVN(bvn);
    if (!result.success) return res.status(400).json({ error: result.message });
  } else if (nin) {
    const result = await verifyNIN(nin);
    if (!result.success) return res.status(400).json({ error: result.message });
  }
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await db.run(
      'INSERT INTO customers (name, email, password, bvn, nin) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashed, bvn, nin]
    );
    const user = { id: result.lastID, name, email };
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET);
    res.json({ user, token });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const result = await db.get('SELECT * FROM customers WHERE email = ?', [email]);
    const user = result;
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET);
    res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};