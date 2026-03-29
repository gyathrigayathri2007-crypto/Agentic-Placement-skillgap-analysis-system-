import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Logo = () => (
  <div style={{ display:'flex', alignItems:'center', gap:9, padding:'4px 4px 20px' }}>
    <div style={{ width:32, height:32, background:'#185FA5', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z"/>
      </svg>
    </div>
    <div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, color:'#0f1923', lineHeight:1 }}>SmartPlacement</div>
      <div style={{ fontSize:10, color:'#8fa0b0', marginTop:2 }}>AI Placement System</div>
    </div>
  </div>
)

const icons = {
  dashboard: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  chat:      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  companies: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  students:  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  skills:    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  courses:   <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>,
  profile:   <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  logout:    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
  external:  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  news:      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v2"/><path d="M4 22a2 2 0 01-2-2v-2h6v2a2 2 0 01-2 2z"/><path d="M18 6h-4m4 4h-4m4 4h-4"/></svg>,
}

const courseLinks = [
  { label: 'LeetCode',   url: 'https://leetcode.com' },
  { label: 'HackerRank', url: 'https://hackerrank.com' },
  { label: 'Coursera',   url: 'https://coursera.org' },
  { label: 'NPTEL',      url: 'https://nptel.ac.in' },
]

/* ── Top-right profile avatar + dropdown ── */
function ProfileMenu({ user, logout, navigate, role }) {
  const [open, setOpen] = useState(false)

  const name     = user?.email?.split('@')[0] || 'U'
  const initials = name.slice(0, 2).toUpperCase()
  const profilePath = role === 'faculty' ? '/faculty' : '/profile/edit'

  return (
    <div style={{ position: 'fixed', top: 18, right: 24, zIndex: 999 }}>
      {/* Avatar circle */}
      <button
        onClick={() => setOpen(o => !o)}
        title={user?.email}
        style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'linear-gradient(135deg, #185FA5 0%, #0c3d6e 100%)',
          color: '#fff', border: '2.5px solid #fff',
          boxShadow: '0 2px 10px rgba(24,95,165,0.25)',
          cursor: 'pointer', fontFamily: 'Sora, sans-serif',
          fontWeight: 700, fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'box-shadow 0.15s, transform 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(24,95,165,0.35)'; e.currentTarget.style.transform = 'scale(1.06)' }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 10px rgba(24,95,165,0.25)'; e.currentTarget.style.transform = 'scale(1)' }}
      >
        {initials}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: -1 }} />

          {/* Dropdown panel */}
          <div style={{
            position: 'absolute', top: 46, right: 0,
            background: '#fff', borderRadius: 12,
            border: '1px solid rgba(0,0,0,0.09)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
            minWidth: 200, overflow: 'hidden',
            animation: 'fadeUp 0.15s ease forwards',
          }}>
            {/* User info */}
            <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #f0f4f9' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f1923' }}>{name}</div>
              <div style={{ fontSize: 11, color: '#8fa0b0', marginTop: 2, textTransform: 'capitalize' }}>{user?.role}</div>
            </div>

            {/* Profile */}
            <button
              onClick={() => { setOpen(false); navigate(profilePath) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '11px 16px',
                background: 'none', border: 'none',
                fontSize: 13, color: '#0f1923', cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f5f8fb'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <span style={{ color: '#8fa0b0' }}>{icons.profile}</span>
              Profile
            </button>

            {/* Sign out */}
            <button
              onClick={() => { setOpen(false); logout() }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '11px 16px',
                background: 'none', border: 'none',
                borderTop: '1px solid #f0f4f9',
                fontSize: 13, color: '#c0392b', cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#fdf0ef'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <span>{icons.logout}</span>
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function Sidebar({ role }) {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const is = (path) => location.pathname === path ? 'nav-link active' : 'nav-link'

  const [coursesOpen, setCoursesOpen] = useState(false)

  const studentLinks = [
    { label: 'Dashboard', path: '/dashboard',    icon: icons.dashboard },
    { label: 'Companies', path: '/companies',     icon: icons.companies },
    { label: 'Skills',    path: '/skills',        icon: icons.skills },
    { label: 'AI Chat',   path: '/chat',          icon: icons.chat },
  ]

  const facultyLinks = [
    { label: 'Dashboard',  path: '/faculty',           icon: icons.dashboard },
    { label: 'Companies',  path: '/faculty/companies', icon: icons.companies },
    { label: 'Students',   path: '/faculty/students',  icon: icons.students },
    { label: 'Skill News', path: '/faculty/news',      icon: icons.news },
  ]

  const links = role === 'faculty' ? facultyLinks : studentLinks

  return (
    <>
      <ProfileMenu user={user} logout={logout} navigate={navigate} role={role} />

      <aside className="sidebar">
        <Logo />

        <nav style={{ flex:1, display:'flex', flexDirection:'column', gap:3 }}>
          {links.map(l => (
            <button key={l.path} className={is(l.path)} onClick={() => navigate(l.path)}>
              {l.icon} {l.label}
            </button>
          ))}

          {/* Courses dropdown — student only */}
          {role === 'student' && (
            <div>
              <button
                className="nav-link"
                onClick={() => setCoursesOpen(o => !o)}
                style={{ width:'100%', justifyContent:'space-between' }}
              >
                <span style={{ display:'flex', alignItems:'center', gap:9 }}>
                  {icons.courses} Courses
                </span>
                <svg
                  width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"
                  viewBox="0 0 24 24"
                  style={{ transform: coursesOpen ? 'rotate(180deg)' : 'rotate(0)', transition:'transform 0.2s', marginLeft:'auto' }}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {coursesOpen && (
                <div style={{ paddingLeft:14, marginTop:2, display:'flex', flexDirection:'column', gap:2 }}>
                  {courseLinks.map(c => (
                    <a
                      key={c.url}
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display:'flex', alignItems:'center', gap:8,
                        padding:'7px 11px', borderRadius:7, fontSize:13,
                        color:'var(--text-2)', textDecoration:'none',
                        transition:'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--surface)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}
                    >
                      {c.label}
                      <span style={{ marginLeft:'auto', opacity:0.5 }}>{icons.external}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>
      </aside>
    </>
  )
}