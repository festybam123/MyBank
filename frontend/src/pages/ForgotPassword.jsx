import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetToken, setResetToken] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setResetToken('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reset email')
      }
      setMessage(data.message || 'If the email exists, a reset link will be sent')
      if (data.reset_token) {
        setResetToken(data.reset_token)
      }
      setEmail('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Forgot Password</h2>
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}
        {resetToken && (
          <div className="alert" style={{ background: '#fef3c7', border: '1px solid #f59e0b' }}>
            <strong>Reset Token (for testing):</strong>
            <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', marginTop: '0.5rem' }}>
              {resetToken}
            </div>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Go to: <a href={`/reset-password?token=${resetToken}`} style={{ color: 'var(--primary)' }}>
                /reset-password?token=TOKEN
              </a>
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link to="/login" style={{ color: 'var(--primary)' }}>Back to Login</Link>
        </p>
      </div>
    </div>
  )
}