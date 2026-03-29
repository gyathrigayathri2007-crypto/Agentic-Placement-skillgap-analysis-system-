import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
    <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z"/>
  </svg>
)
const MSIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="0"   y="0"   width="7.5" height="7.5" fill="#F25022"/>
    <rect x="8.5" y="0"   width="7.5" height="7.5" fill="#7FBA00"/>
    <rect x="0"   y="8.5" width="7.5" height="7.5" fill="#00A4EF"/>
    <rect x="8.5" y="8.5" width="7.5" height="7.5" fill="#FFB900"/>
  </svg>
)

export default function LoginPage() {
  const [role,     setRole]     = useState('student')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
      navigate(data.role === 'faculty' ? '/faculty' : '/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg">
      <div style={{ width:'100%', maxWidth:420 }}>

        {/* Logo */}
        <div className="fade-up" style={{ display:'flex', alignItems:'center', gap:10, marginBottom:28, justifyContent:'center' }}>
          <div style={{ width:38, height:38, background:'#185FA5', borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ShieldIcon />
          </div>
          <div>
            <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:19, color:'#0f1923', lineHeight:1 }}>SmartPlacement</div>
            <div style={{ fontSize:11, color:'#8fa0b0', marginTop:2 }}>Placement Management System</div>
          </div>
        </div>

        <div className="card fade-up-d1" style={{ padding:'2rem' }}>
          <h1 style={{ fontFamily:'Sora,sans-serif', fontSize:22, fontWeight:600, marginBottom:4 }}>Welcome back</h1>
          <p style={{ fontSize:14, color:'var(--text-2)', marginBottom:22 }}>Sign in to your account to continue</p>

          {/* Role tabs */}
          <div style={{ display:'flex', background:'#f3f6fa', borderRadius:9, padding:3, marginBottom:22 }}>
            {['student','faculty'].map(r => (
              <button key={r} onClick={() => setRole(r)} style={{
                flex:1, padding:'7px 0', border:'none', borderRadius:7, cursor:'pointer',
                fontFamily:'DM Sans,sans-serif', fontSize:13,
                fontWeight: role===r ? 500 : 400,
                background: role===r ? '#fff' : 'transparent',
                color:      role===r ? '#0f1923' : 'var(--text-2)',
                boxShadow:  role===r ? '0 1px 4px rgba(0,0,0,0.09)' : 'none',
                transition:'all 0.15s', textTransform:'capitalize'
              }}>{r}</button>
            ))}
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom:16 }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:500, color:'var(--text-2)', marginBottom:6 }}>Email address</label>
              <input className="sp-input" type="email" placeholder={`${role}@college.edu`}
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div style={{ marginBottom:8 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:500, color:'var(--text-2)', marginBottom:6 }}>Password</label>
              <input className="sp-input" type="password" placeholder="Enter your password"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div style={{ textAlign:'right', marginBottom:20 }}>
              <span style={{ fontSize:12, color:'var(--brand)', cursor:'pointer' }}>Forgot password?</span>
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="divider"><span>or</span></div>

          <button className="btn-outline" onClick={() => window.location.href = 'http://localhost:8000/api/auth/microsoft'}>
            <MSIcon /> Continue with Microsoft
          </button>

          <p style={{ textAlign:'center', fontSize:13, color:'var(--text-2)', marginTop:20 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color:'var(--brand)', fontWeight:500, textDecoration:'none' }}>Create one</Link>
          </p>
        </div>

        <p className="fade-up-d3" style={{ textAlign:'center', fontSize:11, color:'var(--text-3)', marginTop:16 }}>
          Secured by Microsoft Azure · SmartPlacement © 2024
        </p>
      </div>
    </div>
  )
}