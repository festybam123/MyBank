import db from './db.js';

async function initDb() {
  try {
    // Create unique indexes
    await db.collection('customers').createIndex({ email: 1 }, { unique: true });
    await db.collection('accounts').createIndex({ account_number: 1 }, { unique: true });
    await db.collection('accounts').createIndex({ customer_id: 1 }, { unique: true });
    console.log('MongoDB indexes created/verified.');
    process.exit(0);
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

initDb();