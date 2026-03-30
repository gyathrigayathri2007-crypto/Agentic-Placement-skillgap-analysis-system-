import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'

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

function getStrength(p) {
  if (!p) return { score:0, label:'', cls:'' }
  let s = 0
  if (p.length >= 8)          s++
  if (/[A-Z]/.test(p))        s++
  if (/[0-9]/.test(p))        s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  if (s <= 1) return { score:s, label:'Weak',   cls:'weak' }
  if (s <= 2) return { score:s, label:'Fair',   cls:'medium' }
  if (s <= 3) return { score:s, label:'Good',   cls:'strong' }
  return       { score:4,     label:'Strong', cls:'strong' }
}

export default function RegisterPage() {
  const [role,    setRole]    = useState('student')
  const [form,    setForm]    = useState({ email:'', password:'', first_name:'', last_name:'' })
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const strength = getStrength(form.password)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    setLoading(true)
    try {
      // Backend sets auth cookie on register — send only schema fields
      const res = await api.post('/auth/register', {
        email: form.email,
        password: form.password,
        role
      })
      setSuccess(true)
      // Always redirect to login — AuthContext.login() handles
      // the smart redirect to /setup or /dashboard based on profile completion
      setTimeout(() => {
        navigate('/login')
      }, 1200)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg">
      <div style={{ width:'100%', maxWidth:440 }}>

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
          <h1 style={{ fontFamily:'Sora,sans-serif', fontSize:22, fontWeight:600, marginBottom:4 }}>
            Create account
            <span style={{ fontSize:11, fontFamily:'DM Sans', fontWeight:500, background:'#e8f1fb', color:'#185FA5', padding:'3px 10px', borderRadius:99, marginLeft:10, verticalAlign:'middle' }}>Free</span>
          </h1>
          <p style={{ fontSize:14, color:'var(--text-2)', marginBottom:20 }}>Choose your role to get started</p>

          {/* Role chips */}
          <div style={{ display:'flex', gap:10, marginBottom:20 }}>
            {[{value:'student',label:'Student',icon:'🎓'},{value:'faculty',label:'Faculty',icon:'👩‍🏫'}].map(r => (
              <button key={r.value} onClick={() => setRole(r.value)} style={{
                flex:1, padding:'11px 8px', borderRadius:10, cursor:'pointer',
                border: role===r.value ? '1.5px solid #185FA5' : '1px solid #d5dde8',
                background: role===r.value ? '#e8f1fb' : '#fff',
                fontFamily:'DM Sans,sans-serif', fontSize:13,
                fontWeight: role===r.value ? 500 : 400,
                color: role===r.value ? '#0c3d6e' : 'var(--text-2)',
                display:'flex', flexDirection:'column', alignItems:'center', gap:5,
                transition:'all 0.15s'
              }}>
                <span style={{ fontSize:22 }}>{r.icon}</span>{r.label}
              </button>
            ))}
          </div>

          {error   && <div className="alert alert-error"   style={{ marginBottom:14 }}>{error}</div>}
          {success && <div className="alert alert-success" style={{ marginBottom:14 }}>Account created! Redirecting to login…</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display:'flex', gap:10, marginBottom:14 }}>
              <div style={{ flex:1 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:500, color:'var(--text-2)', marginBottom:6 }}>First name</label>
                <input className="sp-input" type="text" placeholder="Arun" value={form.first_name} onChange={set('first_name')} required />
              </div>
              <div style={{ flex:1 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:500, color:'var(--text-2)', marginBottom:6 }}>Last name</label>
                <input className="sp-input" type="text" placeholder="Kumar" value={form.last_name} onChange={set('last_name')} required />
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:500, color:'var(--text-2)', marginBottom:6 }}>College email</label>
              <input className="sp-input" type="email" placeholder="you@college.edu" value={form.email} onChange={set('email')} required />
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:500, color:'var(--text-2)', marginBottom:6 }}>Password</label>
              <input className="sp-input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required />
              {form.password && (
                <div style={{ marginTop:8 }}>
                  <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                    {[0,1,2,3].map(i => (
                      <div key={i} className={`strength-bar ${i < strength.score ? strength.cls : ''}`} />
                    ))}
                  </div>
                  <div style={{ fontSize:11, color: strength.cls==='weak' ? 'var(--danger)' : strength.cls==='medium' ? 'var(--warning)' : 'var(--success)' }}>
                    {strength.label} password
                  </div>
                </div>
              )}
            </div>

            {role === 'student' && (
              <div className="alert alert-info" style={{ marginBottom:16 }}>
                ✓ After registration, you'll be guided to complete your placement profile
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={loading || success}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="divider"><span>or</span></div>

          <button className="btn-outline" onClick={() => window.location.href = 'http://localhost:8000/api/auth/microsoft'}>
            <MSIcon /> Continue with Microsoft
          </button>

          <p style={{ textAlign:'center', fontSize:13, color:'var(--text-2)', marginTop:20 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'var(--brand)', fontWeight:500, textDecoration:'none' }}>Sign in</Link>
          </p>
          <p style={{ textAlign:'center', fontSize:11, color:'var(--text-3)', marginTop:10 }}>
            By registering, you agree to our Terms &amp; Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}