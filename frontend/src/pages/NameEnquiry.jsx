import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function NameEnquiry() {
  const { token } = useAuth()
  const [accountNumber, setAccountNumber] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

   const handleSubmit = async (e) => {
     e.preventDefault()
     setError('')
     setName('')
     setLoading(true)
     try {
       const res = await fetch('/api/banking/name-enquiry', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           Authorization: `Bearer ${token}`
         },
         body: JSON.stringify({ account_number: accountNumber.trim() })
       })
       const text = await res.text()
       try {
         const data = JSON.parse(text)
         if (!res.ok) throw new Error(data.error || 'Account not found')
         setName(data.name)
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

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Name Enquiry</h1>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Account Number</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Enter account number"
                style={{ flex: 1 }}
                required
              />
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Checking...' : 'Check Name'}
              </button>
            </div>
          </div>
        </form>

        {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>}

        {name && (
          <div className="alert alert-success" style={{ marginTop: '1rem' }}>
            <strong>Account holder found:</strong> {name}
          </div>
        )}
      </div>

      <div className="card">
        <h3>About Name Enquiry</h3>
        <p style={{ color: 'var(--text-light)', marginTop: '0.5rem' }}>
          Use this feature to verify the account holder's name before making a transfer.
          Enter the destination account number and click "Check Name" to confirm the recipient.
        </p>
      </div>
    </div>
  )
}

//http://localhost:5173/