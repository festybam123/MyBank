import db from './db.js';

async function initDb() {
  try {
    await db.collection('customers').createIndex({ email: 1 }, { unique: true });
    await db.collection('accounts').createIndex({ account_number: 1 }, { unique: true });
    await db.collection('accounts').createIndex({ customer_id: 1 }, { unique: true });
    await db.collection('otps').createIndex({ user_id: 1, purpose: 1, used: 1 });
    await db.collection('otps').createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });
    await db.collection('password_resets').createIndex({ token_hash: 1 });
    await db.collection('password_resets').createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });
    console.log('MongoDB indexes created/verified.');
    process.exit(0);
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

initDb();