import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link, Navigate } from 'react-router-dom'

export default function Register() {
  const { token, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', password: '', bvn: '', nin: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (token) return <Navigate to="/" />

   const handleSubmit = async (e) => {
     e.preventDefault()
     setError('')
     setLoading(true)
     try {
       const res = await fetch('/api/auth/register', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(form)
       })
       const text = await res.text()
       try {
         const data = JSON.parse(text)
         if (!res.ok) throw new Error(data.error || 'Registration failed')
         login(data.user, data.token)
         navigate('/')
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
    <div style={{ maxWidth: '500px', margin: '2rem auto' }}>
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Create Account</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
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
          <div className="form-group">
            <label>BVN (optional)</label>
            <input
              type="text"
              value={form.bvn}
              onChange={(e) => setForm({ ...form, bvn: e.target.value })}
              placeholder="Bank Verification Number"
            />
          </div>
          <div className="form-group">
            <label>NIN (optional)</label>
            <input
              type="text"
              value={form.nin}
              onChange={(e) => setForm({ ...form, nin: e.target.value })}
              placeholder="National Identity Number"
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)' }}>Login</Link>
        </p>
      </div>
    </div>
  )
}
