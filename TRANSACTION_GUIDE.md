# How to Perform a Transaction - Step by Step

## BEFORE YOU CAN TRANSFER:

You need TWO accounts in the system:
1. **Your account** (sender) - YOU create this after registration
2. **Recipient's account** (receiver) - Someone ELSE must create this

---

## COMPLETE FLOW:

### Step 1: Start Both Servers

**Terminal 1 (Backend):**
```
cd C:\Users\HP\Desktop\MyBank
npm run dev
```
Wait for: "MongoDB connected" and "Server running on port 3000"

**Terminal 2 (Frontend):**
```
cd C:\Users\HP\Desktop\MyBank\frontend
npm run dev
```
Wait for: "Local: http://localhost:5173"

### Step 2: Open Browser
Go to: **http://localhost:5173**

### Step 3: Register First User (Alice)
- Click "Don't have an account? Register"
- Fill in: Name: `Alice`, Email: `alice@test.com`, Password: `123456`
- Click Register
- You should be redirected to Dashboard

### Step 4: Create Alice's Bank Account
- On Dashboard, click **"Create Account"** button
- Wait for success message
- You'll see: Account Balance: NGN 15,000 and an Account Number

### Step 5: Register Second User (Bob) - IN ANOTHER BROWSER/INCOGNITO
- Open **http://localhost:5173** in incognito/private window
- Click Register
- Fill in: Name: `Bob`, Email: `bob@test.com`, Password: `123456`
- Click Register
- On Dashboard, click **"Create Account"**
- Note down Bob's account number

### Step 6: Transfer from Alice to Bob
- Switch back to Alice's browser (or log in as Alice)
- Click **"Transfer Money"** in navbar
- Enter Bob's account number
- Click **"Check"** - should show "Account holder: Bob"
- Enter amount: e.g., `1000`
- Click **"Send Money"**
- 🎉 Success! You'll see "Transfer successful!"

### Step 7: Verify Transaction
- Click **"Transactions"** in navbar
- See your debit (-1000) entry
- Now login as Bob and check his transactions - he'll see a credit (+1000)

---

## Common Errors & Fixes:

### ❌ "Sender account not found"
**Cause:** You haven't created your bank account yet.
**Fix:** Go to Dashboard → Click "Create Account"

### ❌ "Recipient not found"
**Cause:** The recipient hasn't registered or doesn't have an account.
**Fix:** The other person must register AND create their bank account first.

### ❌ "Insufficient funds"
**Cause:** You don't have enough money.
**Fix:** Default balance is NGN 15,000. Wait, or ask for more funds in code: `balance: 15000` in accountController.js:15

### ❌ Login fails with "Invalid credentials"
**Cause:** Wrong email/password or user doesn't exist.
**Fix:** Register first with that email

### ❌ Frontend shows "Cannot GET /api/..."
**Cause:** Backend not running.
**Fix:** Start backend server on port 3000

---

## Quick Test (Using API only):

Open browser console on ANY page and paste:

```javascript
// Quick test - creates 2 users and transfers between them
async function quickTest() {
  // User 1
  let r = await fetch('/api/auth/register', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({name:'Test1',email:'t1@t.com',password:'123',bvn:'11111111111'})
  });
  let d = await r.json();
  if(r.status===409) {
    r = await fetch('/api/auth/login', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:'t1@t.com',password:'123'})
    });
    d = await r.json();
  }
  const token1 = d.token;
  
  // Create account for user1
  r = await fetch('/api/accounts/create', {headers:{Authorization:'Bearer '+token1}});
  const acc1 = await r.json();
  console.log('Account1:', acc1.account.account_number);
  
  // User 2
  r = await fetch('/api/auth/register', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({name:'Test2',email:'t2@t.com',password:'123',bvn:'22222222222'})
  });
  d = await r.json();
  const token2 = d.token || (async()=>{(r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'t2@t.com',password:'123'})});d=await r.json();return d.token;})();
  
  // Create account for user2
  r = await fetch('/api/accounts/create', {headers:{Authorization:'Bearer '+token2}});
  const acc2 = await r.json();
  console.log('Account2:', acc2.account.account_number);
  
  // Transfer
  r = await fetch('/api/banking/transfer', {
    method:'POST', headers:{'Content-Type':'application/json', Authorization:'Bearer '+token1},
    body:JSON.stringify({to_account: acc2.account.account_number, amount: 500})
  });
  console.log('Transfer result:', await r.json());
}
quickTest();
```

---

## Important: What "Create Account" Does

When you click "Create Account" on Dashboard:
- System generates a **10-digit account number** (starts with 10)
- Your balance becomes **NGN 15,000** (welcome bonus!)
- Account is stored in MongoDB and linked to your user
- Only AFTER this can you transfer money

---

**Summary:**
1. ✅ Register (creates login)
2. ✅ Create Bank Account (gives you an account number + NGN 15,000)
3. ✅ Other person must also do steps 1-2
4. ✅ Then transfer using their account number

All set? Try it now at **http://localhost:5173**
