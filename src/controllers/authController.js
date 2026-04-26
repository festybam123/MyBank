import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { ObjectId } from 'mongodb';
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
    const result = await db.collection('customers').insertOne({
      name, email, password: hashed, bvn, nin, created_at: new Date()
    });
    const user = { id: result.insertedId, name, email };
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET);
    res.json({ user, token });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const user = await db.collection('customers').findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET);
    res.json({ user: { id: user._id, name: user.name, email: user.email }, token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};