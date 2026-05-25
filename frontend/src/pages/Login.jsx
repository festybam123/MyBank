import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link, Navigate } from 'react-router-dom'

export default function Login() {
  const { token, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (token) return <Navigate to="/" />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const text = await res.text()
      let data
      try {
        data = JSON.parse(text)
      } catch (parseErr) {
        throw new Error('Invalid response from server')
      }
      if (!res.ok) throw new Error(data.error || 'Login failed')
      login(data.user, data.token)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Login</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link to="/forgot-password" style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.5rem' }}>
            Forgot Password?
          </Link>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary)' }}>Register</Link>
        </p>
      </div>
    </div>
  )
}