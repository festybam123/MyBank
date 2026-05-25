import express from 'express';
import { nameEnquiry, getBalance, getTransactionStatus, getTransactions, transfer, requestOTP, verifyOTP } from '../controllers/bankingController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/name-enquiry', authenticateToken, nameEnquiry);
router.get('/balance', authenticateToken, getBalance);
router.get('/transaction/:id', authenticateToken, getTransactionStatus);
router.get('/transactions', authenticateToken, getTransactions);
router.post('/transfer', authenticateToken, transfer);
router.post('/request-otp', authenticateToken, requestOTP);
router.post('/verify-otp', authenticateToken, verifyOTP);

export default router;