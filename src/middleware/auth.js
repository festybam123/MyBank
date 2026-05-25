import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const failedAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  const clientIP = req.ip || req.connection.remoteAddress;
  const attempts = failedAttempts.get(clientIP) || { count: 0, lockUntil: 0 };
  
  if (attempts.lockUntil && Date.now() < attempts.lockUntil) {
    const remaining = Math.ceil((attempts.lockUntil - Date.now()) / 60000);
    return res.status(429).json({ 
      error: `Too many failed attempts. Try again in ${remaining} minutes.` 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      const newAttempts = { 
        count: (attempts.count || 0) + 1,
        lockUntil: (attempts.count || 0) + 1 >= MAX_FAILED_ATTEMPTS 
          ? Date.now() + LOCKOUT_DURATION 
          : 0
      };
      failedAttempts.set(clientIP, newAttempts);
      return res.status(403).json({ error: 'Invalid token' });
    }
    failedAttempts.delete(clientIP);
    req.user = { ...user, id: String(user.id) };
    next();
  });
}

export function generateSecureToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h',
    issuer: 'mybank',
    audience: 'mybank-app'
  });
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}