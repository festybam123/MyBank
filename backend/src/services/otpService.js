import crypto from 'crypto';
import db from '../db.js';
import { ObjectId } from 'mongodb';
import nodemailer from 'nodemailer';

const OTP_EXPIRY_MINUTES = 5;

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

export function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

export function encryptOTP(otp, secret) {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(secret, 'otp-salt', 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(otp, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return { encrypted, iv: iv.toString('hex'), authTag: authTag.toString('hex') };
}

export function decryptOTP(encryptedData, secret) {
  try {
    const { encrypted, iv, authTag } = encryptedData;
    const key = crypto.scryptSync(secret, 'otp-salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return null;
  }
}

export async function storeOTP(userId, otp, purpose = 'transfer') {
  const userIdStr = userId.toString();
  const user = await db.collection('customers').findOne({ _id: new ObjectId(userIdStr) });
  if (!user) throw new Error('User not found');
  
  const secret = process.env.OTP_SECRET || 'default-otp-secret-change-in-production';
  const encrypted = encryptOTP(otp, secret);
  
  const otpRecord = {
    user_id: userIdStr,
    encrypted_otp: encrypted.encrypted,
    iv: encrypted.iv,
    auth_tag: encrypted.authTag,
    purpose,
    created_at: new Date(),
    expires_at: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    used: false
  };
  
  await db.collection('otps').deleteMany({ user_id: userIdStr, purpose, used: false });
  await db.collection('otps').insertOne(otpRecord);
  return otp;
}

export async function verifyOTP(userId, otp, purpose = 'transfer') {
  const userIdStr = userId.toString();
  const secret = process.env.OTP_SECRET || 'default-otp-secret-change-in-production';
  
  const record = await db.collection('otps').findOne({
    user_id: userIdStr,
    purpose,
    used: false
  });
  
  if (!record) {
    console.log(`[OTP Verify] No record found for user ${userIdStr}, purpose ${purpose}`);
    return { valid: false, error: 'No valid OTP found' };
  }
  
  if (new Date() > record.expires_at) {
    await db.collection('otps').updateOne({ _id: record._id }, { $set: { used: true } });
    return { valid: false, error: 'OTP has expired' };
  }
  
  const decrypted = decryptOTP({
    encrypted: record.encrypted_otp,
    iv: record.iv,
    authTag: record.auth_tag
  }, secret);
  
  if (!decrypted || decrypted !== otp) {
    return { valid: false, error: 'Invalid OTP' };
  }
  
  await db.collection('otps').updateOne({ _id: record._id }, { $set: { used: true } });
  return { valid: true };
}

export async function sendOTPViaEmail(email, otp) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[OTP] SMTP not configured. OTP for ${email}: ${otp}`);
    return { simulated: true, otp };
  }
  
  const mailOptions = {
    from: process.env.SMTP_FROM || '"MyBank" <noreply@mybank.com>',
    to: email,
    subject: 'Your MyBank Transfer OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">MyBank Transfer Verification</h2>
        <p>Your one-time password (OTP) for transfer verification is:</p>
        <h1 style="background: #f3f4f6; padding: 20px; text-align: center; letter-spacing: 5px;">${otp}</h1>
        <p>This OTP expires in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr>
        <p style="color: #6b7280; font-size: 12px;">MyBank - Secure Banking</p>
      </div>
    `
  };
  
  try {
    await getTransporter().sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('[OTP] Email send failed:', error.message);
    return { error: error.message };
  }
}

export async function initiateOTPRequest(userId, { channel = 'email' }) {
  const objectId = new ObjectId(userId);
  const user = await db.collection('customers').findOne({ _id: objectId });
  if (!user) throw new Error('User not found');
  
  const otp = generateOTP();
  await storeOTP(userId.toString(), otp, 'transfer');
  
  const result = await sendOTPViaEmail(user.email, otp);
  
  return { 
    success: true, 
    message: 'OTP sent successfully',
    otp: result.simulated ? result.otp : undefined,
    expires_in_minutes: OTP_EXPIRY_MINUTES,
    email_sent: result.success || result.simulated
  };
}

export async function verifyTransferOTP(userId, otp) {
  return await verifyOTP(userId, otp, 'transfer');
}