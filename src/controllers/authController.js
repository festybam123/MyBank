import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { ObjectId } from 'mongodb';
import { verifyBVN, verifyNIN } from '../services/nibss.js';
import { createPasswordReset, verifyResetToken, sendPasswordResetEmail } from '../services/passwordResetService.js';

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
    const token = jwt.sign({ id: user._id.toString(), email: user.email }, process.env.JWT_SECRET);
    res.json({ user: { id: user._id.toString(), name: user.name, email: user.email }, token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  
  try {
    const result = await createPasswordReset(email);
    res.json(result);
  } catch (err) {
    res.json({ message: 'If the email exists, a reset link will be sent' });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const verifyResult = await verifyResetToken(token);
    if (!verifyResult.valid) {
      return res.status(400).json({ error: verifyResult.error });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.collection('customers').updateOne(
      { _id: verifyResult.user_id },
      { $set: { password: hashed } }
    );

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
};