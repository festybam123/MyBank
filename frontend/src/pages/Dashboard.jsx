import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { token, user } = useAuth()
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [setupLoading, setSetupLoading] = useState(false)
  const [setupMessage, setSetupMessage] = useState('')

  useEffect(() => {
    fetchAccount()
  }, [])

   const fetchAccount = async () => {
     try {
       const res = await fetch('/api/accounts/me', {
         headers: { Authorization: `Bearer ${token}` }
       })
       const text = await res.text()
       try {
         const data = JSON.parse(text)
         if (!res.ok) {
           if (res.status === 404) {
             setAccount(null)
             return
           }
           throw new Error(data.error || 'Failed to fetch account')
         }
         setAccount(data.account)
       } catch (e) {
         if (text) {
           throw new Error('Invalid response from server')
         }
         throw new Error('No response from server')
       }
     } catch (err) {
       setError(err.message)
     } finally {
       setLoading(false)
     }
   }

   const createAccount = async () => {
     try {
       const res = await fetch('/api/accounts/create', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           Authorization: `Bearer ${token}`
         }
       })
       const text = await res.text()
       try {
         const data = JSON.parse(text)
         if (!res.ok) throw new Error(data.error || 'Failed to create account')
         setAccount(data.account)
       } catch (e) {
         if (text) {
           throw new Error('Invalid response from server')
         }
         throw new Error('No response from server')
       }
     } catch (err) {
       alert(err.message)
     }
   }

  const runQuickSetup = async () => {
    setSetupLoading(true)
    setSetupMessage('Creating demo recipient account...')
    
    try {
      // Generate unique email for demo user
      const demoEmail = `demo_${Date.now()}@test.com`;
      const demoName = 'Demo Recipient';
      const demoPassword = 'demo123';
      const demoBVN = '99999999999';
      
      // Step 1: Register demo user
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: demoName,
          email: demoEmail,
          password: demoPassword,
          bvn: demoBVN
        })
      });
      
       let demoToken;
      if (registerRes.status === 409) {
        // User exists, login
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: demoEmail, password: demoPassword })
        });
        const loginText = await loginRes.text();
        try {
          const loginData = JSON.parse(loginText);
          demoToken = loginData.token;
        } catch (e) {
          throw new Error(loginText ? 'Invalid response from server' : 'No response from server');
        }
      } else {
        const registerText = await registerRes.text();
        try {
          const registerData = JSON.parse(registerText);
          demoToken = registerData.token;
        } catch (e) {
          throw new Error(registerText ? 'Invalid response from server' : 'No response from server');
        }
      }
      
       // Step 2: Create account for demo user
      const accountRes = await fetch('/api/accounts/create', {
        headers: { Authorization: `Bearer ${demoToken}` }
      });
      const accountText = await accountRes.text();
      let accountData;
      try {
        accountData = JSON.parse(accountText);
      } catch (e) {
        throw new Error(accountText ? 'Invalid response from server' : 'No response from server');
      }
      
      if (!accountRes.ok) {
        throw new Error(accountData.error || 'Failed to create demo account');
      }
      
      const demoAccountNumber = accountData.account.account_number;
      
      setSetupMessage(
        `✅ Demo recipient account created successfully!\n\n` +
        `👤 Name: ${demoName}\n` +
        `📧 Email: ${demoEmail}\n` +
        `🔑 Password: ${demoPassword}\n` +
        `💳 Account Number: ${demoAccountNumber}\n` +
        `💰 Starting Balance: NGN ${accountData.account.balance.toLocaleString()}\n\n` +
        `📋 How to test transfer:\n` +
        `1. Go to "Transfer Money" page above\n` +
        `2. Enter account number: ${demoAccountNumber}\n` +
        `3. Click "Check" to verify name (should show "${demoName}")\n` +
        `4. Enter amount (max NGN ${accountData.account.balance})\n` +
        `5. Click "Send Money" - should succeed!\n\n` +
        `🔍 To verify recipient received money:\n` +
        `- Open this site in a NEW incognito/private window\n` +
        `- Login with email: ${demoEmail} / password: ${demoPassword}\n` +
        `- Check "Transaction History" to see the credit.`
      );
      
    } catch (err) {
      console.error('Quick setup error:', err);
      setSetupMessage('❌ Setup failed: ' + err.message);
    } finally {
      setSetupLoading(false);
    }
  }

  if (loading) return <div className="empty-state"><h3>Loading...</h3></div>

  if (error) return <div className="alert alert-error">{error}</div>

  if (!account) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Welcome to MyBank!</h2>
          <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>
            You don't have an account yet. Create one to get started with your default balance of NGN 15,000.
          </p>
          <button onClick={createAccount} className="btn btn-primary">
            Create Account
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Dashboard</h1>
      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ color: 'var(--text-light)', marginBottom: '0.5rem' }}>Account Balance</h3>
          <div className="balance-display">NGN {Number(account.balance).toLocaleString()}</div>
          <div className="account-number">{account.account_number}</div>
        </div>

        <div className="card">
          <h3 style={{ color: 'var(--text-light)', marginBottom: '0.5rem' }}>Account Holder</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{account.name}</div>
          <div style={{ color: 'var(--text-light)', marginTop: '0.5rem' }}>
            Member since {new Date(account.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/transfer" className="btn btn-primary">Transfer Money</Link>
          <Link to="/transactions" className="btn btn-outline">View Transactions</Link>
          <Link to="/name-enquiry" className="btn btn-outline">Name Enquiry</Link>
        </div>
      </div>

      {!setupMessage && (
        <div className="card" style={{ border: '2px dashed var(--primary)', background: '#f0f7ff' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>🧪 Quick Test Setup</h3>
          <p style={{ marginBottom: '1rem', color: 'var(--text-light)' }}>
            Want to test transfers immediately? Create a demo recipient account automatically.
          </p>
          <button 
            onClick={runQuickSetup} 
            className="btn btn-success"
            disabled={setupLoading}
          >
            {setupLoading ? 'Creating Demo Account...' : 'Create Demo Recipient Account'}
          </button>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
            This creates another user you can transfer to for testing.
          </p>
        </div>
      )}

      {setupMessage && (
        <div className={`card ${setupMessage.includes('✅') ? 'alert-success' : 'alert-error'}`} 
            style={{ whiteSpace: 'pre-line' }}>
          <h3 style={{ marginBottom: '1rem' }}>Setup Complete</h3>
          {setupMessage}
          {setupMessage.includes('✅') && (
            <div style={{ marginTop: '1rem' }}>
              <p><strong>Demo Account Number:</strong></p>
              <div style={{ fontSize: '1.5rem', fontFamily: 'monospace', background: '#fff', 
                           padding: '1rem', borderRadius: '8px', display: 'inline-block', marginTop: '0.5rem' }}>
                {account ? 'Check Transactions page or create another account' : 'Wait...'}
              </div>
              <p style={{ marginTop: '1rem' }}>
                Now go to <a href="/transfer" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Transfer</a> 
                and send some money!
              </p>
            </div>
          )}
          {!setupMessage.includes('✅') && (
            <button onClick={() => setSetupMessage('')} className="btn btn-outline" style={{ marginTop: '1rem' }}>
              Try Again
            </button>
          )}
        </div>
      )}
    </div>
  )
}
