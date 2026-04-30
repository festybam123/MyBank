import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Transfer() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ to_account: '', amount: '', description: '' })
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [hasAccount, setHasAccount] = useState(true)
  const [checkingAccount, setCheckingAccount] = useState(true)

  useEffect(() => {
    checkAccount()
  }, [])

     const checkAccount = async () => {
     try {
       const res = await fetch('/api/accounts/me', {
         headers: { Authorization: `Bearer ${token}` }
       })
       if (res.status === 404) {
         setHasAccount(false)
       } else if (res.ok) {
         setHasAccount(true)
       } else {
         const text = await res.text()
         try {
           const data = JSON.parse(text)
           console.error('Account check failed:', data)
         } catch (e) {
           console.error('Account check failed:', text ? 'Invalid response' : 'No response')
         }
       }
     } catch (err) {
       console.error('Error checking account:', err)
     } finally {
       setCheckingAccount(false)
     }
   }

  if (checkingAccount) {
    return <div className="empty-state"><h3>Loading...</h3></div>
  }

  if (!hasAccount) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--danger)' }}>⚠️ No Bank Account</h2>
          <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
            You cannot transfer money without a bank account.
          </p>
          <div style={{ 
            background: '#f8fafc', 
            padding: '1.5rem', 
            borderRadius: '8px', 
            marginBottom: '1.5rem',
            textAlign: 'left',
            border: '1px solid var(--border)'
          }}>
            <h4 style={{ marginBottom: '0.5rem' }}>Quick Setup (2 minutes):</h4>
            <ol style={{ lineHeight: '1.8' }}>
              <li>Go to <strong>Dashboard</strong> (click "Dashboard" above)</li>
              <li>Click the <strong>"Create Account"</strong> button</li>
              <li>Get your account number and NGN 15,000 welcome bonus</li>
              <li>Come back here to transfer!</li>
            </ol>
          </div>
          <button onClick={() => navigate('/')} className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
            🏦 Go to Dashboard & Create Account
          </button>
        </div>
      </div>
    )
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

   const handleNameEnquiry = async () => {
     if (!form.to_account) return
     try {
       const res = await fetch('/api/banking/name-enquiry', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           Authorization: `Bearer ${token}`
         },
         body: JSON.stringify({ account_number: form.to_account.trim() })
       })
       const text = await res.text()
       try {
         const data = JSON.parse(text)
         if (!res.ok) throw new Error(data.error || 'Account not found')
         setName(data.name)
         setError('')
       } catch (e) {
         if (text) {
           throw new Error('Invalid response from server')
         }
         throw new Error('No response from server')
       }
     } catch (err) {
       setName('')
       setError(err.message)
     }
   }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)
    setLoading(true)
    
    const trimmedAccount = form.to_account.trim();
    
    try {
      const res = await fetch('/api/banking/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          to_account: trimmedAccount,
          amount: Number(form.amount),
          description: form.description
        })
       })
      
      const text = await res.text()
      let data
      try {
        data = JSON.parse(text)
      } catch (e) {
        throw new Error(text ? 'Invalid response from server' : 'No response from server')
      }
      
      if (!res.ok) {
        const errorMsg = data.error || 'Transfer failed';
        
        // User-friendly error messages
        if (errorMsg.includes('Sender account not found') || errorMsg.includes('not logged in')) {
          throw new Error('🚫 You need to create a bank account first. Go to Dashboard and click "Create Account" button.');
        }
        if (errorMsg.includes('Recipient') && errorMsg.includes('not found')) {
          throw new Error(`👤 Recipient account "${trimmedAccount}" not found. The recipient must:\n1. Register on this site\n2. Create their bank account\n\nTip: Open this site in a second browser/incognito window to create a test recipient.`);
        }
        if (errorMsg.includes('Insufficient funds')) {
          const balance = data.currentBalance || 'unknown';
          throw new Error(`💰 Insufficient funds! Your current balance: NGN ${balance.toLocaleString()}`);
        }
        if (errorMsg.includes('own account')) {
          throw new Error('⚠️ You cannot transfer to your own account');
        }
        
        throw new Error(errorMsg);
      }
      
      setResult(data.transaction)
      setForm({ ...form, amount: '', description: '' })
      setName('')
      
      // Refresh account balance (would need to fetch from backend)
      // For now, show success
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Transfer Money</h1>

      {result && (
        <div className="alert alert-success">
          Transfer successful! Transaction ID: {result.id}
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Send Money</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Recipient Account Number</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  name="to_account"
                  value={form.to_account}
                  onChange={handleChange}
                  placeholder="Enter account number"
                  style={{ flex: 1 }}
                  required
                />
                <button type="button" onClick={handleNameEnquiry} className="btn btn-outline">
                  Check
                </button>
              </div>
              {name && <div style={{ marginTop: '0.5rem', color: 'var(--success)', fontWeight: 500 }}>
                Account holder: {name}
              </div>}
            </div>

            <div className="form-group">
              <label>Amount (NGN)</label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                placeholder="0.00"
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>Description (optional)</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="What's this for?"
                rows="3"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processing...' : 'Send Money'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Transfer Info</h3>
          <ul style={{ listStyle: 'none', lineHeight: '2' }}>
            <li>✓ Transfer to any account</li>
            <li>✓ Instant processing</li>
            <li>✓ Get confirmation immediately</li>
            <li>✓ View all transactions in history</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
