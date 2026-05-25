import express from 'express';
import { createAccount, getAccount } from '../controllers/accountController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', authenticateToken, createAccount);
router.get('/me', authenticateToken, getAccount);

export default router;