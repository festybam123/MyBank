import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Transactions() {
  const { token } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTransactions()
  }, [])

   const fetchTransactions = async () => {
     try {
       const res = await fetch('/api/banking/transactions', {
         headers: { Authorization: `Bearer ${token}` }
       })
       const text = await res.text()
       try {
         const data = JSON.parse(text)
         if (!res.ok) throw new Error(data.error || 'Failed to fetch transactions')
         setTransactions(data.transactions)
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

  if (loading) return <div className="empty-state"><h3>Loading transactions...</h3></div>
  if (error) return <div className="alert alert-error">{error}</div>

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Transaction History</h1>

      <div className="card">
        {transactions.length === 0 ? (
          <div className="empty-state">
            <h3>No transactions yet</h3>
            <p>When you make transfers or receive money, they'll appear here.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Recipient Account</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>
                    <span className={`badge ${tx.type === 'credit' ? 'badge-success' : 'badge-danger'}`}>
                      {tx.type.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    NGN {Number(tx.amount).toLocaleString()}
                  </td>
                  <td>{tx.description || '-'}</td>
                  <td style={{ fontFamily: 'monospace' }}>
                    {tx.recipient_account || '-'}
                  </td>
                  <td style={{ color: 'var(--text-light)' }}>
                    {new Date(tx.created_at).toLocaleString()}
                  </td>
                  <td>
                    <span className="badge badge-success">{tx.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
