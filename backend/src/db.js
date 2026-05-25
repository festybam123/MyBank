import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

let db;

try {
  await client.connect();
  db = client.db('mybank');
  console.log('MongoDB connected');
} catch (err) {
  console.error('MongoDB connection error:', err);
  process.exit(1);
}

export default db;