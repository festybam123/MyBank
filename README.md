# MyBank - Full Stack Banking Application

A complete banking website built with React (frontend) and Node.js/Express (backend) with MongoDB.

## Features

- User registration and authentication (JWT)
- Account creation with NGN 15,000 welcome bonus
- Transfer money to any account
- Name enquiry to verify recipient before transfer
- View transaction history with credit/debit status
- Real-time balance updates

## Tech Stack

- **Frontend**: React 18, React Router DOM, Vite
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Auth**: JSON Web Tokens (JWT), bcrypt

## Prerequisites

1. **Node.js** (v16 or higher) - https://nodejs.org/
2. **MongoDB** (v4.4+) - https://www.mongodb.com/try/download/community
3. **Git** (optional)

## Quick Start

### 1. Clone and Setup

```bash
cd MyBank
npm install
cd frontend && npm install && cd ..
```

### 2. Start MongoDB

Make sure MongoDB is running on your system:

**Windows (as service):**
```
net start MongoDB
```

**Or manually:**
```
mongod
```

### 3. Initialize Database

```bash
npm run init-db
```

### 4. Start the Application (Two Terminal Windows)

**Terminal 1 - Backend (port 3000):**
```bash
npm run dev
```

**Terminal 2 - Frontend (port 5173):**
```cd frontend && npm run dev```

### 5. Open in Browser

Visit: http://localhost:5173

## Usage Flow

1. **Register** - Create a new account with name, email, password (BVN/NIN optional)
2. **Login** - Use your credentials
3. **Create Bank Account** - On dashboard, click "Create Account" to get your account number and NGN 15,000 bonus
4. **Transfer Money**:
   - Go to Transfer page
   - Enter recipient's account number
   - Click "Check" to verify recipient name
   - Enter amount and description
   - Click "Send Money"
5. **View Transactions** - See your full history on Transactions page
6. **Name Enquiry** - Standalone page to verify any account holder's name

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Accounts
- `POST /api/accounts/create` - Create bank account (auth required)
- `GET /api/accounts/me` - Get my account (auth required)

### Banking
- `POST /api/banking/name-enquiry` - Check account holder name (auth required)
- `GET /api/banking/balance` - Get account balance (auth required)
- `GET /api/banking/transactions` - Get all transactions (auth required)
- `GET /api/banking/transaction/:id` - Get single transaction (auth required)
- `POST /api/banking/transfer` - Transfer money (auth required)

## Default Setup

- Backend runs on: http://localhost:3000
- Frontend runs on: http://localhost:5173
- Vite proxy configured to forward `/api` requests to backend
- JWT Secret: defined in `.env` file
- Database: `mybank` MongoDB database

## Troubleshooting

### "Backend not reachable" error
- Ensure MongoDB is running: `mongod` or start the service
- Check backend terminal for errors
- Verify backend is on port 3000

### "Network error" in frontend
- Ensure both servers are running
- Check that backend started successfully (MongoDB connected)
- Make sure no other app is using port 3000 or 5173

### Port already in use
Kill the process using:
```bash
# Find PID on Windows
netstat -ano | findstr :3000
taskkill /F /PID <PID>

# Or for frontend (5173)
netstat -ano | findstr :5173
```

### Frontend not updating
- Check browser console for errors (F12)
- Hard refresh: Ctrl+Shift+R
- Clear localStorage: `localStorage.clear()` in console

### MongoDB connection refused
- Start MongoDB service: `net start MongoDB`
- Or run `mongod` manually from MongoDB bin directory

## Project Structure

```
MyBank/
├── server.js              # Express app entry
├── .env                   # Environment variables
├── src/
│   ├── controllers/       # Route handlers
│   ├── routes/           # API routes
│   ├── middleware/       # Auth middleware
│   ├── models.js         # SQL schema (legacy)
│   ├── db.js             # MongoDB connection
│   ├── utils/            # Helper functions
│   └── initDb.js         # DB initialization
├── frontend/
│   ├── src/
│   │   ├── App.jsx       # Main app with routing
│   │   ├── context/      # Auth context
│   │   ├── components/   # Navbar
│   │   └── pages/        # Login, Register, Dashboard, Transfer, etc.
│   ├── index.html
│   └── vite.config.js    # Vite config with proxy
└── package.json
```

## Development Notes

- Backend uses MongoDB with Mongoose for ODM
- JWT tokens stored in frontend localStorage
- All banking routes protected via `authenticateToken` middleware
- Transfer uses MongoDB transaction for atomic updates
- Account numbers auto-generated (10 digits, start with 10)
- Default account balance: NGN 15,000

## Security Features

- Passwords hashed with bcrypt (10 rounds)
- JWT for stateless authentication
- Authorization header checked on protected routes
- Transaction session ensures atomic transfers
- Unique constraints on email and account number

## Next Steps

- Add admin dashboard
- Implement transaction limits
- Add email notifications
- Add 2FA authentication
- Implement account statement PDF generation

---

**Built with Node.js, Express, React, and MongoDB**
