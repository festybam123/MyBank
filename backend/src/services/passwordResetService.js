import crypto from 'crypto';
import db from '../db.js';
import { ObjectId } from 'mongodb';
import nodemailer from 'nodemailer';

const RESET_TOKEN_EXPIRY_HOURS = 1;

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
}

export function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

export async function createPasswordReset(email) {
  const user = await db.collection('customers').findOne({ email });
  if (!user) {
    return { success: false, message: 'If the email exists, a reset link will be sent' };
  }

  const reset_token = generateResetToken();
  const token_hash = crypto.createHash('sha256').update(reset_token).digest('hex');
  
  await db.collection('password_resets').deleteMany({ user_id: user._id });
  await db.collection('password_resets').insertOne({
    user_id: user._id,
    token_hash,
    created_at: new Date(),
    expires_at: new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000),
    used: false
  });

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[PASSWORD RESET] Token for ${email}: ${reset_token}`);
    return { 
      success: true, 
      reset_token, 
      email: user.email,
      message: 'If the email exists, a reset link will be sent',
      simulated: true 
    };
  }

  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${reset_token}`;
  
  const mailOptions = {
    from: process.env.SMTP_FROM || '"MyBank" <noreply@mybank.com>',
    to: email,
    subject: 'MyBank Password Reset',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">MyBank Password Reset</h2>
        <p>You requested a password reset. Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p>This link expires in <strong>${RESET_TOKEN_EXPIRY_HOURS} hour</strong>.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr>
        <p style="color: #6b7280; font-size: 12px;">MyBank - Secure Banking</p>
      </div>
    `
  };

  try {
    await getTransporter().sendMail(mailOptions);
    return { 
      success: true, 
      email: user.email,
      message: 'If the email exists, a reset link will be sent'
    };
  } catch (error) {
    console.error('[PASSWORD RESET] Email send failed:', error.message);
    return { 
      success: true, 
      reset_token,
      email: user.email,
      message: 'If the email exists, a reset link will be sent',
      simulated: true 
    };
  }
}

export async function verifyResetToken(token) {
  const token_hash = crypto.createHash('sha256').update(token).digest('hex');
  
  const record = await db.collection('password_resets').findOne({
    token_hash,
    used: false
  });

  if (!record) return { valid: false, error: 'Invalid reset token' };
  
  if (new Date() > record.expires_at) {
    await db.collection('password_resets').updateOne({ _id: record._id }, { $set: { used: true } });
    return { valid: false, error: 'Reset token has expired' };
  }

  await db.collection('password_resets').updateOne({ _id: record._id }, { $set: { used: true } });
  return { valid: true, user_id: record.user_id };
}

export async function sendPasswordResetEmail(email, reset_token) {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${reset_token}`;
  console.log(`[PASSWORD RESET] Reset link: ${resetLink}`);
  return true;
}