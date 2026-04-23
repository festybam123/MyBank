import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import authRouter from './src/routes/auth.js';
import bankingRouter from './src/routes/banking.js';
import accountsRouter from './src/routes/accounts.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth', authRouter);
app.use('/api/banking', bankingRouter);
app.use('/api/accounts', accountsRouter);

app.get('/', (req, res) => {
  res.json({ message: 'MyBank API running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});