# MongoDB Connection Guide

## Connection Details
- **Host**: localhost:27017
- **Database**: mybank
- **Driver**: mongodb (v7.2.0)

## Quick Start

### 1. Start MongoDB Server
MongoDB is already running on your system (mongod.exe PID: 24976).

### 2. Initialize Database (Create Indexes)
```bash
node src/initDb.js
```
Output: "MongoDB indexes created/verified."

### 3. Start Application Server
```bash
node server.js
```
The server starts on http://localhost:3000

### 4. View Database Contents
```bash
node scripts/view-db.js
```

## Database Structure

### Collections

1. **customers**
   - Fields: `_id`, `name`, `email`, `password`, `bvn`, `nin`, `created_at`
   - Unique index: `email`

2. **accounts**
   - Fields: `_id`, `customer_id` (ObjectId ref), `account_number`, `balance`, `created_at`
   - Unique indexes: `account_number`, `customer_id`

3. **transactions**
   - Fields: `_id`, `account_id` (ObjectId ref), `type`, `amount`, `description`, `status`, `recipient_account`, `created_at`

## Testing the API

### Register User
```bash
node -e "
import http from 'http';
const req = http.request({
  hostname: 'localhost', port: 3000, path: '/api/auth/register',
  method: 'POST', headers: {'Content-Type': 'application/json'}
}, (res) => {
  let d=''; res.on('data',c=>d+=c); res.on('end',()=>console.log(d));
});
req.write(JSON.stringify({name:'Test',email:'test@example.com',password:'pass123',bvn:'12345678901'}));
req.end();
"
```

### Login
```bash
node -e "
import http from 'http';
const req = http.request({
  hostname: 'localhost', port: 3000, path: '/api/auth/login',
  method: 'POST', headers: {'Content-Type': 'application/json'}
}, (res) => {
  let d=''; res.on('data',c=>d+=c); res.on('end',()=>console.log(d));
});
req.write(JSON.stringify({email:'test@example.com',password:'pass123'}));
req.end();
"
```

## Environment Variables (.env)
```
MONGODB_URI=mongodb://localhost:27017
JWT_SECRET=mybank_secret_key_2024
PORT=3000
```

## Server Process
- PID: 41848 (running in background)
- Status: Active on port 3000

## Files Modified for MongoDB
1. `src/db.js` - MongoDB client connection
2. `src/initDb.js` - MongoDB index creation
3. `src/controllers/authController.js` - MongoDB queries
4. `src/controllers/accountController.js` - MongoDB + aggregation
5. `src/controllers/bankingController.js` - MongoDB + transactions
6. `.env` - Updated connection string
7. `package.json` - Added mongodb dependency

## Key Changes from SQLite
- IDs: `lastID` → `insertedId` (ObjectId)
- Joins: SQL JOIN → `$lookup` aggregation
- Transactions: Implicit → MongoDB multi-document transactions
- Unique: SQL UNIQUE → MongoDB unique indexes (error code 11000)
- Queries: `db.run('SELECT...')` → `db.collection().find()`
