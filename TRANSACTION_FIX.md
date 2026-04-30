# Transaction Fix - Complete Setup

## ✅ SERVERS MUST BE RUNNING

**Terminal 1 (Backend):**
```bash
cd C:\Users\HP\Desktop\MyBank
npm run dev
```
**Expected output:**
```
MongoDB connected
Server running on port 3000
```

**Terminal 2 (Frontend):**
```bash
cd C:\Users\HP\Desktop\MyBank\frontend
npm run dev
```
**Expected output:**
```
VITE v5.x.x ready in xxx ms
➜ Local: http://localhost:5173/
```

---

## 🔍 DIAGNOSE YOUR ISSUE

Open your browser console on http://localhost:5173 and paste this:

```javascript
// Diagnostic script
(async () => {
  console.log('=== MyBank Diagnostics ===\n');
  
  // Test 1: Backend connection
  try {
    const r = await fetch('http://localhost:3000/');
    const d = await r.json();
    console.log('✓ Backend reachable:', d.message);
  } catch(e) {
    console.error('✗ Backend NOT reachable. Is it running?', e.message);
    return;
  }
  
  // Test 2: Check if you have an account
  const token = localStorage.getItem('token');
  if(!token) {
    console.log('⚠ Not logged in. Please login first.');
    return;
  }
  
  try {
    const r = await fetch('/api/accounts/me', {
      headers: {Authorization: 'Bearer '+token}
    });
    const d = await r.json();
    if(r.status === 404) {
      console.log('⚠ You DON\'T have a bank account. Go to Dashboard and click "Create Account"');
    } else {
      console.log('✓ Your account:', d.account.account_number);
      console.log('✓ Balance: NGN', d.account.balance);
    }
  } catch(e) {
    console.error('Error checking account:', e);
  }
  
  console.log('\n=== End Diagnostics ===');
})();
```

---

## 📋 COMPLETE TRANSACTION FLOW

### **STEP 1:** Register & Login
1. Go to http://localhost:5173
2. Click "Don't have an account? Register"
3. Fill form → Register
4. You're now logged in

### **STEP 2:** Create Your Bank Account (CRITICAL!)
**THIS IS WHAT MOST PEOPLE MISS!**

On the Dashboard page, you must see:
- ❌ "You don't have an account yet" message
- ✅ A button **"Create Account"**

**Click "Create Account" button!**

After clicking, you should see:
- Account Number: `10xxxxxxxx` (10 digits)
- Balance: **NGN 15,000** (welcome bonus!)

**If you skip this, you CANNOT transfer!**

### **STEP 3:** Transfer Needs a Recipient

To test transfer, you need **two users**:

**Option A - Use browser incognito:**
1. Open http://localhost:5173 in **Incognito window** (Ctrl+Shift+N)
2. Register as second user (Bob)
3. Create Bob's account
4. Copy Bob's account number
5. Go back to first window (Alice)
6. Transfer → Enter Bob's account → Check name → Send money

**Option B - Use test script in console:**

Open console on any page and paste:

```javascript
// Quick setup: Creates 2 accounts and transfers between them
async function setupAndTest() {
  // Register User 1
  let r = await fetch('/api/auth/register', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      name: 'Alice',
      email: 'alice'+Date.now()+'@test.com',
      password: 'test123',
      bvn: '11111111111'
    })
  });
  let d = await r.json();
  let token1 = d.token;
  
  // Create account for Alice
  r = await fetch('/api/accounts/create', {
    headers:{Authorization:'Bearer '+token1}
  });
  d = await r.json();
  const aliceAcc = d.account.account_number;
  console.log('✓ Alice account:', aliceAcc, 'Balance:', d.account.balance);
  
  // Register User 2
  r = await fetch('/api/auth/register', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      name: 'Bob',
      email: 'bob'+Date.now()+'@test.com',
      password: 'test123',
      bvn: '22222222222'
    })
  });
  d = await r.json();
  const token2 = d.token;
  
  // Create account for Bob
  r = await fetch('/api/accounts/create', {
    headers:{Authorization:'Bearer '+token2}
  });
  d = await r.json();
  const bobAcc = d.account.account_number;
  console.log('✓ Bob account:', bobAcc, 'Balance:', d.account.balance);
  
  // Transfer from Alice to Bob
  r = await fetch('/api/banking/transfer', {
    method:'POST',
    headers:{'Content-Type':'application/json', Authorization:'Bearer '+token1},
    body:JSON.stringify({to_account: bobAcc, amount: 500, description: 'Test transfer'})
  });
  d = await r.json();
  
  if(r.ok) {
    console.log('✓ Transfer successful! ID:', d.transaction.id);
    console.log('✓ Now check Transactions page to see it!');
  } else {
    console.error('✗ Transfer failed:', d.error);
  }
}
setupAndTest();
```

---

## ⚠️ COMMON ERRORS & FIXES

### Error: "Sender account not found"
**Fix:** You haven't created your bank account yet. Go to Dashboard → Click "Create Account" button.

### Error: "Recipient not found"
**Fix:** The recipient hasn't created their account. They must register AND create an account first.

### Error: "Insufficient funds"
**Fix:** Your balance is too low. Default is NGN 15,000. You can edit `accountController.js` line 15 to change initial balance.

### CORS error / Network error
**Fix:** Ensure backend is running on port 3000. Check terminal 1 for errors.

### Cannot GET /api/accounts/me
**Fix:** Backend not running. Start it with `npm run dev` in project root.

---

## 🧪 VERIFY EVERYTHING WORKS

Run this in browser console to see all your data:

```javascript
// Show your current state
(async () => {
  const token = localStorage.getItem('token');
  if(!token) return console.log('Not logged in');
  
  // Get user info
  const user = JSON.parse(localStorage.getItem('user')||'{}');
  console.log('Logged in as:', user.name);
  
  // Check account
  const accRes = await fetch('/api/accounts/me', {
    headers:{Authorization:'Bearer '+token}
  });
  if(accRes.ok) {
    const acc = await accRes.json();
    console.log('Account:', acc.account);
  } else {
    console.log('No account - need to create one');
  }
  
  // Get transactions
  const txRes = await fetch('/api/banking/transactions', {
    headers:{Authorization:'Bearer '+token}
  });
  if(txRes.ok) {
    const tx = await txRes.json();
    console.log('Transactions:', tx.transactions);
  }
})();
```

---

## 🎯 QUICK FIX SUMMARY

**Most likely you're missing Step 2 (Create Account).**

**Do this NOW:**
1. Open http://localhost:5173
2. Login (or register)
3. On Dashboard, click the **"Create Account"** button
4. You'll see account number and NGN 15,000 balance
5. Now you can transfer!

**To test transfer:**
- Open incognito window → register second user → create their account
- Copy their account number
- Go back to first window → Transfer → enter that number → Send

---

## 📊 Verify Backend is Running

If frontend shows "Cannot GET /api/...", run these checks:

```bash
# Check port 3000 is listening
netstat -ano | findstr :3000

# If nothing shows, backend not running. Start it:
cd C:\Users\HP\Desktop\MyBank
npm run dev
```

---

**Everything is coded correctly. You just need to:**
1. ✅ Have backend running (port 3000)
2. ✅ Have frontend running (port 5173)
3. ✅ Register as a user
4. ✅ **Click "Create Account" on Dashboard** ← This is the missing step!
5. ✅ Transfer to another **existing** account

**Try it now and let me know what error you see!**
