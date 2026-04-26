import db from '../db.js';
import { ObjectId } from 'mongodb';

export const nameEnquiry = async (req, res) => {
  const { account_number } = req.body;
  if (!account_number) return res.status(400).json({ error: 'Account number required' });
  try {
    const result = await db.collection('accounts').aggregate([
      {
        $match: { account_number }
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
          name: '$customer.name'
        }
      }
    ]).toArray();
    if (!result || result.length === 0) return res.status(404).json({ error: 'Account not found' });
    res.json({ name: result[0].name });
  } catch (err) {
    res.status(500).json({ error: 'Name enquiry failed' });
  }
};

export const getBalance = async (req, res) => {
  try {
    const result = await db.collection('accounts').findOne({ customer_id: new ObjectId(req.user.id) }, { projection: { balance: 1 } });
    if (!result) return res.status(404).json({ error: 'No account found' });
    res.json({ balance: result.balance });
  } catch (err) {
    res.status(500).json({ error: 'Balance check failed' });
  }
};

export const getTransactionStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.collection('transactions').findOne({ _id: new ObjectId(id) });
    if (!result) return res.status(404).json({ error: 'Transaction not found' });
    const account = await db.collection('accounts').findOne({ customer_id: new ObjectId(req.user.id) });
    if (!account || result.account_id.toString() !== account._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json({ transaction: { ...result, id: result._id } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const account = await db.collection('accounts').findOne({ customer_id: new ObjectId(req.user.id) });
    if (!account) return res.status(404).json({ error: 'No account found' });
    const txs = await db.collection('transactions').find({ account_id: account._id }).sort({ created_at: -1 }).toArray();
    res.json({ transactions: txs.map(t => ({ ...t, id: t._id })) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

export const transfer = async (req, res) => {
  const { to_account, amount, description } = req.body;
  if (!to_account || !amount) return res.status(400).json({ error: 'to_account and amount required' });
  if (amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  const session = db.client.startSession();
  try {
    session.startTransaction();
    const sender = await db.collection('accounts').findOne({ customer_id: new ObjectId(req.user.id) }, { session });
    if (!sender) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Sender account not found' });
    }
    if (sender.balance < amount) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Insufficient funds' });
    }
    const recipient = await db.collection('accounts').findOne({ account_number: to_account }, { session });
    if (!recipient) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Recipient not found' });
    }

    await db.collection('accounts').updateOne(
      { _id: sender._id },
      { $inc: { balance: -amount } },
      { session }
    );
    await db.collection('accounts').updateOne(
      { _id: recipient._id },
      { $inc: { balance: amount } },
      { session }
    );
    const tx1 = await db.collection('transactions').insertOne({
      account_id: sender._id,
      type: 'debit',
      amount,
      description: description || '',
      status: 'success',
      recipient_account: to_account,
      created_at: new Date()
    }, { session });
    await db.collection('transactions').insertOne({
      account_id: recipient._id,
      type: 'credit',
      amount,
      description: description || '',
      status: 'success',
      recipient_account: sender.account_number,
      created_at: new Date()
    }, { session });
    await session.commitTransaction();
    res.json({ transaction: { id: tx1.insertedId, account_id: sender._id, type: 'debit', amount, description: description || '', status: 'success', recipient_account: to_account } });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ error: 'Transfer failed' });
  } finally {
    session.endSession();
  }
};