import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Transfer from './pages/Transfer'
import Transactions from './pages/Transactions'
import NameEnquiry from './pages/NameEnquiry'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth()
  if (loading) return <div className="container">Loading...</div>
  return token ? children : <Navigate to="/login" />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/transfer" element={<ProtectedRoute><Transfer /></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
      <Route path="/name-enquiry" element={<ProtectedRoute><NameEnquiry /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <div className="container">
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}