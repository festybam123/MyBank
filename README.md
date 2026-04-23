# MyBank Backend

A Node.js/Express backend for a digital banking system.

## Features
- Customer onboarding (BVN/NIN verification)
- Account management (one account per customer, pre-funded ₦15,000)
- Core banking operations (name enquiry, intra/inter-bank transfer, balance check, transaction status)
- Transaction history with strict data privacy
- Integration with NibssByPhoenix API (mocked for demo)

## Setup

1. Clone the repo and install dependencies:
   ```sh
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your credentials.
3. Initialize the database tables:
   ```sh
   node src/initDb.js
   ```
4. Start the server:
   ```sh
   npm run dev
   ```

## API Endpoints

- `POST /api/auth/register` — Register (onboard) a new customer
- `POST /api/auth/login` — Login
- `POST /api/accounts/create` — Create a bank account
- `GET /api/accounts/me` — Get your account details
- `POST /api/banking/name-enquiry` — Name enquiry
- `GET /api/banking/balance` — Check account balance
- `POST /api/banking/transfer` — Intra-bank transfer
- `GET /api/banking/transactions` — Transaction history
- `GET /api/banking/transaction/:id` — Transaction status

## Notes
- All protected endpoints require a JWT token in the `Authorization: Bearer <token>` header.
- For demo, BVN/NIN verification is mocked. Replace with real NibssByPhoenix API integration as needed.

---

Built for Backend Engineering Assignment – Digital Banking System
