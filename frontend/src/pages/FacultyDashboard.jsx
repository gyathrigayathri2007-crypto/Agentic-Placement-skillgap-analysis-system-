import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import api from '../api/axios'

function ReadinessBar({ score }) {
  const color = score >= 70 ? 'var(--success)' : score >= 40 ? 'var(--warning)' : 'var(--danger)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#f0f4f9', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score || 0}%`, background: color, borderRadius: 3, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 32 }}>{Math.round(score || 0)}%</span>
    </div>
  )
}

function StudentDetailModal({ studentId, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/faculty/students/${studentId}`)
      .then(res => setDetail(res.data))
      .finally(() => setLoading(false))
  }, [studentId])

  const s = detail?.student
  const companies = detail?.companies || []

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 660, maxHeight: '88vh', overflowY: 'auto', position: 'relative' }}
        onClick={e => e.stopPropagation()}>

        {loading ? (
          <div style={{ padding: 60, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
        ) : (
          <>
            {/* Modal header */}
            <div style={{ padding: '24px 28px 0', position: 'sticky', top: 0, background: '#fff', zIndex: 1, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
              <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 20, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-3)' }}>×</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>👤</div>
                <div>
                  <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 18, fontWeight: 700 }}>{s?.name || '—'}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{s?.department} · {s?.year} · Section {s?.section || '—'}</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '20px 28px 28px' }}>

              {/* Basic info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'CGPA',          value: s?.cgpa || '—' },
                  { label: 'Readiness',     value: `${Math.round(s?.readiness_score || 0)}%` },
                  { label: 'LeetCode',      value: `${s?.leetcode_count || 0} solved` },
                  { label: 'HackerRank',    value: s?.hackerrank_score || 0 },
                  { label: 'Skills',        value: `${s?.skills?.length || 0} skills` },
                  { label: 'Projects',      value: `${s?.projects?.length || 0} projects` },
                ].map(item => (
                  <div key={item.label} style={{ background: '#fafbfc', borderRadius: 8, padding: '12px 14px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>{item.label.toUpperCase()}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Readiness score bar */}
              <div style={{ marginBottom: 20, padding: '14px 16px', background: 'var(--brand-light)', borderRadius: 10, border: '1px solid #c5d9f5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}>Placement Readiness Score</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>{Math.round(s?.readiness_score || 0)}%</span>
                </div>
                <div style={{ height: 10, background: '#d6e8f9', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${s?.readiness_score || 0}%`,
                    background: (s?.readiness_score || 0) >= 70 ? 'var(--success)' : (s?.readiness_score || 0) >= 40 ? 'var(--warning)' : 'var(--danger)',
                    borderRadius: 5, transition: 'width 0.5s'
                  }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--brand)', marginTop: 6 }}>
                  {(s?.readiness_score || 0) >= 70 ? '🎯 Placement Ready' : (s?.readiness_score || 0) >= 40 ? '📈 Developing — needs improvement' : '⚠️ Needs significant work'}
                </div>
              </div>

              {/* Skills */}
              {s?.skills?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>SKILLS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {s.skills.map((sk, i) => (
                      <span key={i} className="badge badge-info">{sk.skill_name || sk}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {s?.projects?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>PROJECTS</div>
                  {s.projects.map((p, i) => (
                    <div key={i} style={{ padding: '10px 12px', background: '#fafbfc', borderRadius: 8, marginBottom: 6, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{p.title}</div>
                      {p.description && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>{p.description}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Internships */}
              {s?.internships?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>INTERNSHIPS</div>
                  {s.internships.map((inn, i) => (
                    <div key={i} style={{ padding: '10px 12px', background: '#fafbfc', borderRadius: 8, marginBottom: 6, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{inn.company}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{inn.role}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Company eligibility */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>COMPANY ELIGIBILITY ({companies.length})</div>
                {companies.length === 0 ? (
                  <div className="alert alert-info" style={{ fontSize: 12 }}>AI analysis not run yet for this student.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {companies.map((c, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fafbfc', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{c.company_name}</div>
                          {c.package && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>💰 {c.package}</div>}
                        </div>
                        <span className={`badge ${c.status === 'eligible' ? 'badge-success' : c.status === 'near_eligible' ? 'badge-warning' : 'badge-danger'}`}>
                          {c.status === 'eligible' ? '✓ Eligible' : c.status === 'near_eligible' ? '⚡ Near' : '✗ Not Eligible'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function FacultyDashboard() {
  const [stats,      setStats]      = useState(null)
  const [students,   setStudents]   = useState([])
  const [search,     setSearch]     = useState('')
  const [filter,     setFilter]     = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [deptFilter, setDeptFilter] = useState('all')
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [selected,   setSelected]   = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/faculty/stats'),
      api.get('/faculty/students'),
    ]).then(([s, st]) => {
      setStats(s.data)
      setStudents(st.data)
    }).catch(err => {
      console.error('[FacultyDashboard] Fetch error:', err)
      setError(err.response?.data?.detail || 'Failed to load dashboard data. Please check your permissions.')
    }).finally(() => setLoading(false))
  }, [])

  // Build export URL with the active filters so the downloaded file matches what's on screen
  const exportExcel = () => {
    const params = new URLSearchParams()
    if (yearFilter !== 'all') params.set('year', yearFilter)
    if (deptFilter !== 'all') params.set('department', deptFilter)
    if (search.trim())        params.set('search', search.trim())
    const qs = params.toString()
    window.open(`http://localhost:8000/api/faculty/export${qs ? '?' + qs : ''}`, '_blank')
  }

  // Derive unique year and department values from loaded students
  const yearOptions = ['all', ...Array.from(new Set(students.map(s => s.year).filter(Boolean))).sort()]
  const deptOptions = ['all', ...Array.from(new Set(students.map(s => s.department).filter(Boolean))).sort()]

  const filtered = students.filter(s => {
    const matchSearch = !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.department?.toLowerCase().includes(search.toLowerCase())
    const score = s.readiness_score || 0
    const matchScore =
      filter === 'all'    ||
      (filter === 'ready' && score >= 70) ||
      (filter === 'mid'   && score >= 40 && score < 70) ||
      (filter === 'low'   && score < 40)
    const matchYear = yearFilter === 'all' || s.year === yearFilter
    const matchDept = deptFilter === 'all' || s.department === deptFilter
    return matchSearch && matchScore && matchYear && matchDept
  })

  const statusBadge = score => {
    if (!score) return <span className="badge" style={{ background: '#f0f4f9', color: 'var(--text-3)' }}>No data</span>
    if (score >= 70) return <span className="badge badge-success">🎯 Ready</span>
    if (score >= 40) return <span className="badge badge-warning">📈 Developing</span>
    return <span className="badge badge-danger">⚠️ Needs Work</span>
  }

  if (loading) return (
    <div className="app-shell">
      <Sidebar role="faculty" />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </main>
    </div>
  )

  if (error) return (
    <div className="app-shell">
      <Sidebar role="faculty" />
      <main className="main-content">
        <div className="alert alert-error" style={{ margin: '20px auto', maxWidth: 600 }}>
          <strong>Error:</strong> {error}
          <div style={{ marginTop: 10 }}>
            <button className="btn-primary" style={{ width: 'auto' }} onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </main>
    </div>
  )

  return (
    <div className="app-shell">
      <Sidebar role="faculty" />
      <main className="main-content">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 22, fontWeight: 700 }}>Faculty Dashboard</div>
            <div style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 4 }}>Monitor all student placement readiness</div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>
            {[
              { label: 'Total Students',    value: stats.total_students    || 0, icon: '👥' },
              { label: 'Total Companies',   value: stats.total_companies   || 0, icon: '🏢' },
              { label: 'Avg Readiness',     value: `${Math.round(stats.avg_readiness_score || 0)}%`, icon: '📊' },
              { label: 'Score ≥ 75%',       value: stats.above_75_count    || 0, icon: '🎯' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Readiness distribution */}
        {students.length > 0 && (
          <div className="card" style={{ padding: '18px 22px', marginBottom: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 14 }}>Placement Readiness Distribution</div>
            <div style={{ display: 'flex', gap: 16 }}>
              {[
                { label: 'Ready (≥70%)',     count: students.filter(s => (s.readiness_score||0) >= 70).length,                                    color: 'var(--success)' },
                { label: 'Developing (40–70%)', count: students.filter(s => (s.readiness_score||0) >= 40 && (s.readiness_score||0) < 70).length, color: 'var(--warning)' },
                { label: 'Needs Work (<40%)', count: students.filter(s => (s.readiness_score||0) < 40).length,                                    color: 'var(--danger)'  },
              ].map(d => (
                <div key={d.label} style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                    <span style={{ color: 'var(--text-2)' }}>{d.label}</span>
                    <span style={{ fontWeight: 600, color: d.color }}>{d.count}</span>
                  </div>
                  <div style={{ height: 8, background: '#f0f4f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${students.length ? (d.count / students.length) * 100 : 0}%`, background: d.color, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search + Filter + Table */}
        <div className="card" style={{ overflow: 'hidden' }}>

          {/* Row 1: Search + Readiness filter chips */}
          <div style={{ padding: '14px 20px 0', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input className="sp-input" style={{ paddingLeft: 30 }} placeholder="Search by name…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { key: 'all',   label: 'All' },
                { key: 'ready', label: '🎯 Ready' },
                { key: 'mid',   label: '📈 Developing' },
                { key: 'low',   label: '⚠️ Needs Work' },
              ].map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)} style={{
                  padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 12,
                  cursor: 'pointer', background: filter === f.key ? 'var(--brand)' : '#fff',
                  color: filter === f.key ? '#fff' : 'var(--text-2)', transition: 'all 0.15s'
                }}>{f.label}</button>
              ))}
            </div>
          </div>

          {/* Row 2: Year + Department dropdowns + count + export */}
          <div style={{ padding: '10px 20px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Year filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>Year:</span>
              <select
                value={yearFilter}
                onChange={e => setYearFilter(e.target.value)}
                style={{
                  padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)',
                  fontSize: 12, color: yearFilter !== 'all' ? 'var(--brand)' : 'var(--text-2)',
                  background: yearFilter !== 'all' ? 'var(--brand-light)' : '#fff',
                  cursor: 'pointer', fontWeight: yearFilter !== 'all' ? 600 : 400,
                  outline: 'none',
                }}
              >
                {yearOptions.map(y => (
                  <option key={y} value={y}>{y === 'all' ? 'All Years' : y}</option>
                ))}
              </select>
            </div>

            {/* Department filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>Dept:</span>
              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                style={{
                  padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)',
                  fontSize: 12, color: deptFilter !== 'all' ? 'var(--brand)' : 'var(--text-2)',
                  background: deptFilter !== 'all' ? 'var(--brand-light)' : '#fff',
                  cursor: 'pointer', fontWeight: deptFilter !== 'all' ? 600 : 400,
                  outline: 'none',
                }}
              >
                {deptOptions.map(d => (
                  <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>
                ))}
              </select>
            </div>

            {/* Clear filters link — only shows when any filter is active */}
            {(yearFilter !== 'all' || deptFilter !== 'all' || filter !== 'all' || search) && (
              <button
                onClick={() => { setYearFilter('all'); setDeptFilter('all'); setFilter('all'); setSearch('') }}
                style={{
                  fontSize: 11, color: 'var(--danger)', background: 'none',
                  border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 5,
                }}
              >
                ✕ Clear filters
              </button>
            )}

            <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 'auto' }}>
              {filtered.length} of {students.length} student{students.length !== 1 ? 's' : ''}
            </span>

            {/* Contextual export button — downloads only filtered students */}
            <button
              onClick={exportExcel}
              title={`Export ${filtered.length} student${filtered.length !== 1 ? 's' : ''} as Excel`}
              style={{
                padding: '7px 14px', background: 'var(--brand)', color: '#fff',
                border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                flexShrink: 0,
              }}
            >
              ⬇ Export ({filtered.length})
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Dept / Year</th>
                  <th>CGPA</th>
                  <th>Skills</th>
                  <th>Eligible For</th>
                  <th>Readiness</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 40 }}>
                    {students.length === 0 ? 'No students have completed their profile yet.' : 'No students match your filter.'}
                  </td></tr>
                )}
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.name || '—'}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 12 }}>
                      <div>{s.department || '—'}</div>
                      <div style={{ color: 'var(--text-3)' }}>{s.year || '—'}</div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{s.cgpa || '—'}</td>
                    <td>
                      <span style={{ fontSize: 12, background: 'var(--brand-light)', color: 'var(--brand)', padding: '3px 8px', borderRadius: 12, fontWeight: 500 }}>
                        {s.skills_count || 0} skills
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, background: '#f0fff8', color: 'var(--success)', padding: '3px 8px', borderRadius: 12, fontWeight: 500 }}>
                        {s.eligible_companies_count || 0} companies
                      </span>
                    </td>
                    <td style={{ minWidth: 140 }}>
                      <ReadinessBar score={s.readiness_score} />
                    </td>
                    <td>{statusBadge(s.readiness_score)}</td>
                    <td>
                      <button onClick={() => setSelected(s.id)} style={{
                        fontSize: 12, color: 'var(--brand)', background: 'var(--brand-light)',
                        border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontWeight: 500
                      }}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Student detail modal */}
        {selected && <StudentDetailModal studentId={selected} onClose={() => setSelected(null)} />}

      </main>
    </div>
  )
}