import db from '../db.js';
import { ObjectId } from 'mongodb';
import { generateAccountNumber } from '../utils/accountNumber.js';

export const createAccount = async (req, res) => {
  try {
    const existing = await db.collection('accounts').findOne({ customer_id: new ObjectId(req.user.id) });
    if (existing) {
      return res.status(409).json({ error: 'Account already exists' });
    }
    const account_number = generateAccountNumber();
    const result = await db.collection('accounts').insertOne({
      customer_id: new ObjectId(req.user.id),
      account_number,
      balance: 15000,
      created_at: new Date()
    });
    res.json({ account: { id: result.insertedId, customer_id: req.user.id, account_number, balance: 15000 } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create account' });
  }
};

export const getAccount = async (req, res) => {
  try {
    const result = await db.collection('accounts').aggregate([
      {
        $match: { customer_id: new ObjectId(req.user.id) }
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $unwind: '$customer'
      },
      {
        $project: {
          account_number: 1,
          balance: 1,
          created_at: 1,
          customer_id: 1,
          'name': '$customer.name'
        }
      }
    ]).toArray();
    if (!result || result.length === 0) return res.status(404).json({ error: 'No account found' });
    res.json({ account: result[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch account' });
  }
};