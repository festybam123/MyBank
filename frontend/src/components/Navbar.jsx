import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const isActive = (path) => location.pathname === path ? 'active' : ''

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">MyBank</Link>
        {user && (
          <>
            <ul className="navbar-nav">
              <li><Link to="/" className={isActive('/')}>Dashboard</Link></li>
              <li><Link to="/transfer" className={isActive('/transfer')}>Transfer</Link></li>
              <li><Link to="/transactions" className={isActive('/transactions')}>Transactions</Link></li>
              <li><Link to="/name-enquiry" className={isActive('/name-enquiry')}>Name Enquiry</Link></li>
            </ul>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontWeight: 500 }}>{user.name}</span>
              <button onClick={logout} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  )
}
