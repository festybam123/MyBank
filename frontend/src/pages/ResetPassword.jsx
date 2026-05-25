import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match')
    }
    
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters')
    }
    
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: form.password })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password')
      }
      setMessage('Password reset successfully! Redirecting to login...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Reset Password</h2>
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link to="/login" style={{ color: 'var(--primary)' }}>Back to Login</Link>
        </p>
      </div>
    </div>
  )
}