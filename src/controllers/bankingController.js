import db from '../db.js';
import { ObjectId } from 'mongodb';
import { initiateOTPRequest, verifyTransferOTP } from '../services/otpService.js';

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
    const balance = typeof result.balance === 'number' ? result.balance : Number(result.balance);
    res.json({ balance: balance });
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

export const requestOTP = async (req, res) => {
  try {
    const userId = req.user.id.toString();
    const result = await initiateOTPRequest(userId, { channel: 'email' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send OTP', message: err.message });
  }
};

export const verifyOTP = async (req, res) => {
  const { otp } = req.body;
  if (!otp) return res.status(400).json({ error: 'OTP required' });
  const userId = req.user.id.toString();
  const result = await verifyTransferOTP(userId, otp);
  if (!result.valid) {
    return res.status(401).json({ error: result.error });
  }
  res.json({ valid: true, message: 'OTP verified' });
};

export const transfer = async (req, res) => {
  const { to_account, amount, description, otp } = req.body;

  if (!to_account || !amount || !otp) {
    return res.status(400).json({ error: 'to_account, amount, and OTP are required' });
  }

  const userId = req.user.id.toString();
  const otpResult = await verifyTransferOTP(userId, otp);
  if (!otpResult.valid) {
    return res.status(401).json({ error: `OTP verification failed: ${otpResult.error}` });
  }

  console.log('Transfer attempt:', { from: userId, to_account, amount, description });

  if (isNaN(amount) || Number(amount) <= 0) {
    console.log('Invalid amount:', amount);
    return res.status(400).json({ error: 'Invalid amount' });
  }
  const amountNum = Number(amount);

  const accountNumber = to_account.toString().trim();
  if (!/^\d{10,11}$/.test(accountNumber)) {
    console.log('Invalid account number format:', accountNumber);
    return res.status(400).json({ error: 'Invalid account number format. Must be 10-11 digits.' });
  }

  try {
    const sender = await db.collection('accounts').findOne(
      { customer_id: new ObjectId(userId) }
    );

    if (!sender) {
      console.log('Sender account not found for user:', userId);
      return res.status(404).json({
        error: 'Sender account not found. Please create a bank account first.'
      });
    }

    console.log('Sender found:', { account: sender.account_number, balance: sender.balance });

    if (sender.balance < amountNum) {
      console.log('Insufficient funds:', { balance: sender.balance, needed: amountNum });
      return res.status(400).json({
        error: 'Insufficient funds',
        currentBalance: sender.balance,
        required: amountNum
      });
    }

    const recipient = await db.collection('accounts').findOne(
      { account_number: accountNumber }
    );

    if (!recipient) {
      console.log('Recipient not found:', accountNumber);
      return res.status(404).json({
        error: `Recipient account ${accountNumber} not found. The recipient must register and create an account.`
      });
    }

    console.log('Recipient found:', recipient.account_number);

    if (sender._id.toString() === recipient._id.toString()) {
      return res.status(400).json({ error: 'Cannot transfer to your own account' });
    }

    const debitResult = await db.collection('accounts').updateOne(
      { _id: sender._id, balance: { $gte: amountNum } },
      { $inc: { balance: -amountNum } }
    );

    if (debitResult.modifiedCount === 0) {
      console.log('Failed to debit sender - insufficient funds or concurrent modification');
      return res.status(400).json({
        error: 'Insufficient funds or concurrent modification'
      });
    }

    await db.collection('accounts').updateOne(
      { _id: recipient._id },
      { $inc: { balance: amountNum } }
    );

    console.log('Balance updates completed');

    const [tx1, tx2] = await Promise.all([
      db.collection('transactions').insertOne({
        account_id: sender._id,
        type: 'debit',
        amount: amountNum,
        description: description || '',
        status: 'success',
        recipient_account: accountNumber,
        created_at: new Date(),
        encrypted: true
      }),
      db.collection('transactions').insertOne({
        account_id: recipient._id,
        type: 'credit',
        amount: amountNum,
        description: description || '',
        status: 'success',
        recipient_account: sender.account_number,
        created_at: new Date(),
        encrypted: true
      })
    ]);

    console.log('Transfer completed successfully');

    res.json({
      transaction: {
        id: tx1.insertedId,
        account_id: sender._id,
        type: 'debit',
        amount: amountNum,
        description: description || '',
        status: 'success',
        recipient_account: accountNumber
      },
      newBalance: sender.balance - amountNum
    });

  } catch (err) {
    console.error('Transfer error:', err);
    res.status(500).json({
      error: 'Transfer failed',
      message: err.message
    });
  }
};