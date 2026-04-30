import db from '../db.js';
import { ObjectId } from 'mongodb';

export const nameEnquiry = async (req, res) => {
  const { account_number } = req.body;
  if (!account_number) return res.status(400).json({ error: 'Account number required' });
  const accNum = account_number.toString().trim();
  try {
    const result = await db.collection('accounts').aggregate([
      { $match: { account_number: accNum } },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' },
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
    const result = await db.collection('accounts').findOne(
      { customer_id: new ObjectId(req.user.id) },
      { projection: { balance: 1 } }
    );
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
    const txs = await db.collection('transactions')
      .find({ account_id: account._id })
      .sort({ created_at: -1 })
      .toArray();
    res.json({ transactions: txs.map(t => ({ ...t, id: t._id })) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

export const transfer = async (req, res) => {
  const { to_account, amount, description } = req.body;
  console.log('Transfer attempt:', { from: req.user.id, to_account, amount, description });

  if (!to_account || !amount) {
    console.log('Missing fields');
    return res.status(400).json({ error: 'to_account and amount required' });
  }
  if (amount <= 0) {
    console.log('Invalid amount');
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const accountNumber = to_account.toString().trim();
  const session = db.client.startSession();

  try {
    session.startTransaction();

    // Find sender
    const sender = await db.collection('accounts').findOne(
      { customer_id: new ObjectId(req.user.id) },
      { session }
    );

    if (!sender) {
      await session.abortTransaction();
      console.log('Sender account not found for user:', req.user.id);
      return res.status(404).json({
        error: 'Sender account not found. Please create a bank account first.'
      });
    }

    console.log('Sender found:', { account: sender.account_number, balance: sender.balance });

    if (sender.balance < amount) {
      await session.abortTransaction();
      console.log('Insufficient funds:', { balance: sender.balance, needed: amount });
      return res.status(400).json({
        error: 'Insufficient funds',
        currentBalance: sender.balance,
        required: amount
      });
    }

    // Find recipient
    const recipient = await db.collection('accounts').findOne(
      { account_number: accountNumber },
      { session }
    );

    if (!recipient) {
      await session.abortTransaction();
      console.log('Recipient not found:', accountNumber);
      return res.status(404).json({
        error: `Recipient account ${accountNumber} not found. The recipient must register and create an account.`
      });
    }

    console.log('Recipient found:', recipient.account_number);

    // Prevent self-transfer
    if (sender._id.toString() === recipient._id.toString()) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Cannot transfer to your own account' });
    }

    // Debit sender
    await db.collection('accounts').updateOne(
      { _id: sender._id },
      { $inc: { balance: -amount } },
      { session }
    );

    // Credit recipient
    await db.collection('accounts').updateOne(
      { _id: recipient._id },
      { $inc: { balance: amount } },
      { session }
    );

    console.log('Balance updates completed');

    // Create transactions
    const [tx1] = await Promise.all([
      db.collection('transactions').insertOne({
        account_id: sender._id,
        type: 'debit',
        amount,
        description: description || '',
        status: 'success',
        recipient_account: accountNumber,
        created_at: new Date()
      }, { session }),
      db.collection('transactions').insertOne({
        account_id: recipient._id,
        type: 'credit',
        amount,
        description: description || '',
        status: 'success',
        recipient_account: sender.account_number,
        created_at: new Date()
      }, { session })
    ]);

    await session.commitTransaction();

    console.log('Transfer completed successfully');

    res.json({
      transaction: {
        id: tx1.insertedId,
        account_id: sender._id,
        type: 'debit',
        amount,
        description: description || '',
        status: 'success',
        recipient_account: accountNumber
      },
      newBalance: sender.balance - amount
    });

  } catch (err) {
    await session.abortTransaction();
    console.error('Transfer error:', err);
    res.status(500).json({
      error: 'Transfer failed',
      message: err.message
    });
  } finally {
    session.endSession();
  }
};
