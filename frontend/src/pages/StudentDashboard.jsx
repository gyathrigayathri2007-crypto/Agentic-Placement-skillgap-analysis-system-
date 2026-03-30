import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'
import Sidebar from '../components/Sidebar'
import SkillNewsDrawer from '../components/SkillNewsDrawer'
import api from '../api/axios'

/* ─── Readiness Gauge ─── */
function ReadinessGauge({ score }) {
  const color = score >= 70 ? '#1D9E75' : score >= 40 ? '#BA7517' : '#e24b4a'
  const data = [
    { value: score,       fill: color },
    { value: 100 - score, fill: '#f0f4f9' },
  ]
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" data={data} startAngle={90} endAngle={-270} barSize={14}>
            <RadialBar dataKey="value" cornerRadius={7} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 30, fontWeight: 700, color, lineHeight: 1 }}>{Math.round(score)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>/ 100</div>
        </div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color, marginTop: 8 }}>
        {score >= 70 ? '🎯 Placement Ready' : score >= 40 ? '📈 Developing' : '⚠️ Needs Work'}
      </div>
    </div>
  )
}

const STATUS_CONFIG = {
  eligible:      { cls: 'badge-success', label: '✓ Eligible',      color: 'var(--success)' },
  near_eligible: { cls: 'badge-warning', label: '⚡ Near Eligible', color: 'var(--warning)' },
  not_eligible:  { cls: 'badge-danger',  label: '✗ Not Eligible',  color: 'var(--danger)'  },
}

/* ─── Company Detail Modal ─── */
function CompanyModal({ result, onClose }) {
  if (!result) return null
  const cfg = STATUS_CONFIG[result.status] || STATUS_CONFIG.not_eligible
  // skill_gap comes as JSON from backend — parse if string
  let skillGap = result.skill_gap || {}
  if (typeof skillGap === 'string') {
    try { skillGap = JSON.parse(skillGap) } catch { skillGap = {} }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '28px 28px 24px', maxWidth: 580, width: '100%', maxHeight: '85vh', overflowY: 'auto', position: 'relative' }}
        onClick={e => e.stopPropagation()}>

        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-3)', lineHeight: 1 }}>×</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏢</div>
          <div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>{result.company_name}</div>
            <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {result.package && (
            <div style={{ background: '#fafbfc', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>PACKAGE</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>💰 {result.package}</div>
            </div>
          )}
        </div>

        {/* Skill Gap */}
        {Object.keys(skillGap).length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>SKILL GAP ANALYSIS</div>
            {Object.entries(skillGap).map(([skill, data]) => {
              const studentLvl = typeof data === 'object' ? (data.student_level ?? 0) : 0
              const required   = typeof data === 'object' ? (data.required ?? 100) : 100
              return (
                <div key={skill} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-2)', marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{skill}</span>
                    <span style={{ color: studentLvl < required ? 'var(--danger)' : 'var(--success)' }}>
                      {studentLvl}% / {required}%
                    </span>
                  </div>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{
                      width: `${studentLvl}%`,
                      background: studentLvl === 0 ? 'var(--danger)' : studentLvl < required ? 'var(--warning)' : 'var(--success)'
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {Object.keys(skillGap).length === 0 && (
          <div className="alert alert-info">No skill gaps for this company — you meet all requirements! 🎉</div>
        )}
      </div>
    </div>
  )
}

/* ─── Eligibility Card ─── */
function EligibilityCard({ result, onClick }) {
  const cfg = STATUS_CONFIG[result.status] || STATUS_CONFIG.not_eligible
  let skillGap = result.skill_gap || {}
  if (typeof skillGap === 'string') {
    try { skillGap = JSON.parse(skillGap) } catch { skillGap = {} }
  }
  const gapCount = Object.keys(skillGap).length

  return (
    <div className="card" style={{ padding: 18, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
      onClick={() => onClick(result)}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(24,95,165,0.12)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏢</div>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>{result.company_name}</div>
        </div>
        <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
      </div>

      {result.package && (
        <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>💰 {result.package}</div>
      )}

      {gapCount > 0 && (
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>
          {gapCount} skill gap{gapCount > 1 ? 's' : ''} identified
        </div>
      )}
      {gapCount === 0 && result.status === 'eligible' && (
        <div style={{ fontSize: 11, color: 'var(--success)' }}>✓ All skill requirements met</div>
      )}

      <div style={{ marginTop: 10, fontSize: 12, color: 'var(--brand)', fontWeight: 500 }}>View details →</div>
    </div>
  )
}

/* ─── Main Dashboard ─── */
export default function StudentDashboard() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,    setError]    = useState(null)
  const [tab,     setTab]     = useState('overview')
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('all')
  const [modal,   setModal]   = useState(null)
  const [recommendations, setRecs] = useState([])
  const [newsOpen, setNewsOpen] = useState(false)
  const navigate = useNavigate()

  const fetchDashboard = () => {
    api.get('/students/dashboard')
      .then(res => {
        setData(res.data)
        // Also fetch recommendations separately
        return api.get('/students/profile')
      })
      .catch(err => {
        if (err.response?.status === 404) navigate('/setup')
        else {
          console.error('[StudentDashboard] Fetch error:', err)
          setError(err.response?.data?.detail || 'Failed to load dashboard. Please verify your student profile.')
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchDashboard()

    // If AI is still running (readiness=0), poll every 5s up to 60s
    const poll = setInterval(() => {
      api.get('/students/dashboard').then(res => {
        setData(res.data)
        const score = res.data?.readiness_score || res.data?.student?.readiness_score || 0
        if (score > 0) clearInterval(poll)
      }).catch(() => clearInterval(poll))
    }, 5000)

    // Stop polling after 60 seconds
    const timeout = setTimeout(() => clearInterval(poll), 60000)

    return () => { clearInterval(poll); clearTimeout(timeout) }
  }, [])

  // Fetch recommendations
  useEffect(() => {
    api.get('/ai/recommendations/me').then(res => setRecs(res.data || [])).catch(() => {})
  }, [])

  if (loading) return (
    <div className="app-shell">
      <Sidebar role="student" />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </main>
    </div>
  )

  if (error) return (
    <div className="app-shell">
      <Sidebar role="student" />
      <main className="main-content">
        <div className="alert alert-error" style={{ margin: '20px auto', maxWidth: 600 }}>
          <strong>Error:</strong> {error}
          <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-2)' }}>
            This page is for students. If you are faculty, please use the faculty dashboard.
          </p>
          <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
            <button className="btn-primary btn-sm" style={{ width: 'auto' }} onClick={() => window.location.reload()}>Retry</button>
            <button className="btn-outline btn-sm" style={{ width: 'auto' }} onClick={() => navigate('/login')}>Switch Account</button>
          </div>
        </div>
      </main>
    </div>
  )

  if (!data) return (
    <div className="app-shell">
      <Sidebar role="student" />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="alert alert-info">No dashboard data found.</div>
      </main>
    </div>
  )

  // Backend returns: { student, readiness_score, companies: [...], progress: [...] }
  const student  = data.student || {}
  // companies array from backend has: company_id, company_name, package, status, skill_gap
  const companies = data.companies || []
  const readiness = data.readiness_score || student.readiness_score || 0
  const isAiAnalyzing = readiness === 0 && companies.length === 0

  if (isAiAnalyzing) {
    return (
      <div className="app-shell">
        <Sidebar role="student" />
        <main className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '80vh', gap: 24 }}>
          <div className="spinner" style={{ width: 44, height: 44, border: '4px solid var(--border)', borderTopColor: 'var(--brand)' }}></div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>Analyzing your skills...</div>
            <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>Our Agentic AI is evaluating your profile, matching you with companies,<br/>and generating personalized learning roadmaps.</div>
          </div>
        </main>
      </div>
    )
  }


  const eligible     = companies.filter(c => c.status === 'eligible')
  const nearEligible = companies.filter(c => c.status === 'near_eligible')
  const notEligible  = companies.filter(c => c.status === 'not_eligible')

  // Search + filter
  const filtered = companies.filter(c => {
    const matchSearch = !search || c.company_name?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || c.status === filter
    return matchSearch && matchFilter
  })

  const scoreData = [
    { name: 'CGPA',        value: Math.round(((student.cgpa || 0) / 10) * 30) },
    { name: 'LeetCode',    value: Math.round(Math.min((student.leetcode_count || 0) / 200, 1) * 25) },
    { name: 'Skills',      value: Math.round(Math.min(((student.skills?.length) || 0) / 10, 1) * 20) },
    { name: 'Projects',    value: Math.round(Math.min(((student.projects?.length) || 0) / 3, 1) * 15) },
    { name: 'Internships', value: Math.round(Math.min(((student.internships?.length) || 0) / 2, 1) * 10) },
  ]

  // Aggregate skill gaps
  const allGaps = {}
  companies.forEach(c => {
    let sg = c.skill_gap || {}
    if (typeof sg === 'string') { try { sg = JSON.parse(sg) } catch { sg = {} } }
    Object.entries(sg).forEach(([skill, d]) => {
      if (!allGaps[skill]) allGaps[skill] = { ...d, count: 1 }
      else { allGaps[skill].student_level = (allGaps[skill].student_level || 0) + (d.student_level || 0); allGaps[skill].count++ }
    })
  })
  const topGaps = Object.entries(allGaps)
    .map(([skill, d]) => ({ skill, student_level: Math.round((d.student_level || 0) / d.count), required: d.required || 100 }))
    .sort((a, b) => (b.required - b.student_level) - (a.required - a.student_level))
    .slice(0, 8)

  return (
    <div className="app-shell">
      <Sidebar role="student" />
      <main className="main-content">

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--text-1)' }}>
            Hello, {student.name?.split(' ')[0] || 'Student'} 👋
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 4 }}>
            {[student.department, student.year, student.cgpa && `CGPA ${student.cgpa}`].filter(Boolean).join(' · ')}
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Readiness Score',    value: `${Math.round(readiness)}%`, icon: '📊' },
            { label: 'Eligible',           value: eligible.length,             icon: '✅' },
            { label: 'Near Eligible',      value: nearEligible.length,         icon: '⚡' },
            { label: 'Total Analysed',     value: companies.length,            icon: '🔍' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 22, background: '#f3f6fa', borderRadius: 9, padding: 3, width: 'fit-content' }}>
          {['overview', 'eligibility', 'skill gaps', 'recommendations'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '7px 16px', border: 'none', borderRadius: 7, cursor: 'pointer',
              fontFamily: 'DM Sans,sans-serif', fontSize: 13, fontWeight: tab === t ? 500 : 400,
              background: tab === t ? '#fff' : 'transparent',
              color: tab === t ? 'var(--text-1)' : 'var(--text-2)',
              boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.09)' : 'none',
              textTransform: 'capitalize', transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}>{t}</button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
            <div className="card" style={{ padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 18 }}>Readiness Score</div>
              <ReadinessGauge score={readiness} />
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {scoreData.map(d => (
                  <div key={d.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-2)', marginBottom: 3 }}>
                      <span>{d.name}</span>
                      <span style={{ fontWeight: 500 }}>{d.value}pts</span>
                    </div>
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width: `${Math.min(d.value * 3.33, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 16 }}>Score Breakdown</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={scoreData} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }} />
                    <Bar dataKey="value" fill="#185FA5" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card" style={{ padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 12 }}>Your Skills</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {student.skills?.length > 0
                    ? student.skills.map(s => <span key={s.skill_name || s} className="badge badge-info">{s.skill_name || s}</span>)
                    : <span style={{ fontSize: 13, color: 'var(--text-3)' }}>No skills added</span>
                  }
                </div>
              </div>

              <div className="card" style={{ padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 12 }}>Placement Summary</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {[
                    { label: 'Eligible',      count: eligible.length,     color: 'var(--success)' },
                    { label: 'Near Eligible', count: nearEligible.length, color: 'var(--warning)' },
                    { label: 'Not Eligible',  count: notEligible.length,  color: 'var(--danger)'  },
                  ].map(s => (
                    <div key={s.label} style={{ flex: 1, textAlign: 'center', padding: '12px 8px', background: '#fafbfc', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.count}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {companies.length === 0 && (
                  <div className="alert alert-info" style={{ marginTop: 12 }}>
                    {isAiAnalyzing ? '⏳ AI is analyzing your profile…' : 'No companies added yet. Ask your faculty to add companies.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── ELIGIBILITY ── */}
        {tab === 'eligibility' && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input className="sp-input" style={{ paddingLeft: 34 }} placeholder="Search by company name…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { key: 'all',           label: 'All' },
                  { key: 'eligible',      label: '✓ Eligible' },
                  { key: 'near_eligible', label: '⚡ Near' },
                  { key: 'not_eligible',  label: '✗ Not Eligible' },
                ].map(f => (
                  <button key={f.key} onClick={() => setFilter(f.key)} style={{
                    padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12,
                    cursor: 'pointer', background: filter === f.key ? 'var(--brand)' : '#fff',
                    color: filter === f.key ? '#fff' : 'var(--text-2)', fontWeight: filter === f.key ? 500 : 400,
                    transition: 'all 0.15s'
                  }}>{f.label}</button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="alert alert-info">
                {companies.length === 0
                  ? isAiAnalyzing ? '⏳ AI is running — results will appear here shortly.' : 'No companies analyzed yet. Ask your faculty to add companies.'
                  : 'No results match your filter.'}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 14 }}>
                {filtered.map((c, i) => <EligibilityCard key={i} result={c} onClick={setModal} />)}
              </div>
            )}
          </div>
        )}

        {/* ── SKILL GAPS ── */}
        {tab === 'skill gaps' && (
          <div>
            {topGaps.length === 0 ? (
              <div className="alert alert-info">
                {isAiAnalyzing
                  ? '⏳ Skill gap analysis is being computed by AI. Check back in a few seconds.'
                  : companies.length === 0
                    ? 'No companies analyzed yet.'
                    : '🎉 No skill gaps — you meet all requirements!'}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="card" style={{ padding: 24, gridColumn: 'span 2' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 4 }}>Overall Skill Gap Analysis</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>Average across all analyzed companies</div>
                  {topGaps.map(({ skill, student_level, required }) => (
                    <div key={skill} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>{skill}</span>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Yours: <strong style={{ color: student_level < required ? 'var(--danger)' : 'var(--success)' }}>{student_level}%</strong></span>
                          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Required: <strong>{required}%</strong></span>
                          {student_level < required && (
                            <span style={{ fontSize: 11, background: '#fff3f3', color: 'var(--danger)', padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>Gap: {required - student_level}%</span>
                          )}
                        </div>
                      </div>
                      <div style={{ position: 'relative', height: 8, background: '#f0f4f9', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${required}%`, background: '#e8eef5', borderRadius: 4 }} />
                        <div style={{
                          position: 'absolute', left: 0, top: 0, height: '100%',
                          width: `${student_level}%`,
                          background: student_level === 0 ? 'var(--danger)' : student_level < required ? 'var(--warning)' : 'var(--success)',
                          borderRadius: 4, transition: 'width 0.5s ease'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="card" style={{ padding: 20, background: 'var(--brand-light)', border: '1px solid #c5d9f5' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)', marginBottom: 10 }}>💡 How to improve</div>
                  <div style={{ fontSize: 13, color: '#2a5a8c', lineHeight: 1.7 }}>
                    Focus on skills with the largest gaps first. Check the <strong>Recommendations</strong> tab for AI-generated learning roadmaps.
                  </div>
                </div>

                <div className="card" style={{ padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 10 }}>📚 Learning Resources</div>
                  {[
                    { name: 'LeetCode DSA', url: 'https://leetcode.com' },
                    { name: 'HackerRank Practice', url: 'https://hackerrank.com' },
                    { name: 'Coursera', url: 'https://coursera.org' },
                    { name: 'NPTEL (Free)', url: 'https://nptel.ac.in' },
                  ].map(r => (
                    <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'block', fontSize: 13, color: 'var(--brand)', marginBottom: 6, textDecoration: 'none' }}>
                      → {r.name}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── RECOMMENDATIONS ── */}
        {tab === 'recommendations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {isAiAnalyzing && (
              <div className="alert alert-info">⏳ AI is generating your personalized roadmaps. Check back in 15–30 seconds.</div>
            )}
            {!isAiAnalyzing && recommendations.length === 0 && (
              <div className="alert alert-info">
                No recommendations yet. You need to be eligible or near-eligible for at least one company, and companies must be added by your faculty.
              </div>
            )}
            {recommendations.map((rec, i) => (
              <div key={i} className="card" style={{ padding: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>🏢</div>
                    <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 16, fontWeight: 600 }}>
                      {rec.company?.name || rec.company_name || `Company ${i + 1}`}
                    </div>
                  </div>
                  <span className="badge badge-info">🤖 AI Roadmap</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {rec.roadmap || 'Roadmap being generated…'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {modal && <CompanyModal result={modal} onClose={() => setModal(null)} />}

      </main>

      {/* ── Skill News pull-tab (right edge) ── */}
      <button
        onClick={() => setNewsOpen(true)}
        title="View Skill News from faculty"
        style={{
          position: 'fixed',
          top: '50%',
          right: 0,
          transform: 'translateY(-50%)',
          zIndex: 990,
          background: '#185FA5',
          color: '#fff',
          border: 'none',
          borderRadius: '10px 0 0 10px',
          padding: '14px 6px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          boxShadow: '-3px 0 12px rgba(24,95,165,0.25)',
          transition: 'background 0.15s, padding 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#0c3d6e'; e.currentTarget.style.paddingRight = '10px' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#185FA5'; e.currentTarget.style.paddingRight = '6px' }}
      >
        {/* Left-pointing arrow */}
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {/* Vertical label */}
        <span style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          fontSize: 10,
          fontWeight: 700,
          fontFamily: 'Sora, sans-serif',
          letterSpacing: '0.06em',
          transform: 'rotate(180deg)',
          userSelect: 'none',
        }}>NEWS</span>
      </button>

      {/* ── News Drawer ── */}
      <SkillNewsDrawer isOpen={newsOpen} onClose={() => setNewsOpen(false)} />

    </div>
  )
}