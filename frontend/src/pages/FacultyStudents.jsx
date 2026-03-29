import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import api from '../api/axios'

export default function FacultyStudents() {
  const [students, setStudents] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('all')
  const [selected, setSelected] = useState(null)
  const [detail,   setDetail]   = useState(null)

  useEffect(() => {
    api.get('/faculty/students').then(res => setStudents(res.data)).finally(() => setLoading(false))
  }, [])

  const viewStudent = async (id) => {
    setSelected(id); setDetail(null)
    const res = await api.get(`/faculty/students/${id}`)
    setDetail(res.data)
  }

  const filtered = students.filter(s => {
    const matchSearch = s.name?.toLowerCase().includes(search.toLowerCase()) || s.department?.toLowerCase().includes(search.toLowerCase())
    if (filter === 'ready')      return matchSearch && (s.readiness_score || 0) >= 70
    if (filter === 'developing') return matchSearch && (s.readiness_score || 0) >= 40 && (s.readiness_score || 0) < 70
    if (filter === 'needs_work') return matchSearch && (s.readiness_score || 0) < 40
    return matchSearch
  })

  return (
    <div className="app-shell">
      <Sidebar role="faculty" />
      <main className="main-content">
        <div style={{ marginBottom:28 }}>
          <div style={{ fontFamily:'Sora,sans-serif', fontSize:22, fontWeight:700 }}>All Students</div>
          <div style={{ fontSize:14, color:'var(--text-2)', marginTop:4 }}>View and filter registered students</div>
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
          <input className="sp-input" style={{ maxWidth:280 }} placeholder="Search by name or department…"
            value={search} onChange={e => setSearch(e.target.value)} />
          <div style={{ display:'flex', background:'#f3f6fa', borderRadius:9, padding:3 }}>
            {[
              { value:'all',        label:'All' },
              { value:'ready',      label:'Ready' },
              { value:'developing', label:'Developing' },
              { value:'needs_work', label:'Needs Work' },
            ].map(f => (
              <button key={f.value} onClick={() => setFilter(f.value)} style={{
                padding:'6px 14px', border:'none', borderRadius:7, cursor:'pointer',
                fontFamily:'DM Sans,sans-serif', fontSize:13,
                fontWeight: filter===f.value ? 500 : 400,
                background: filter===f.value ? '#fff' : 'transparent',
                color: filter===f.value ? 'var(--text-1)' : 'var(--text-2)',
                boxShadow: filter===f.value ? '0 1px 4px rgba(0,0,0,0.09)' : 'none',
                transition:'all 0.15s'
              }}>{f.label}</button>
            ))}
          </div>
          <span style={{ fontSize:13, color:'var(--text-3)', alignSelf:'center' }}>{filtered.length} result{filtered.length!==1?'s':''}</span>
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:60 }}><div className="spinner" /></div>
        ) : (
          <div className="card" style={{ overflow:'hidden' }}>
            <div style={{ overflowX:'auto' }}>
              <table className="sp-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Dept</th>
                    <th>Year</th>
                    <th>CGPA</th>
                    <th>LeetCode</th>
                    <th>Skills</th>
                    <th>Readiness</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign:'center', color:'var(--text-3)', padding:40 }}>No students match your filter</td></tr>
                  )}
                  {filtered.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight:500 }}>{s.name || '—'}</td>
                      <td style={{ color:'var(--text-2)' }}>{s.department || '—'}</td>
                      <td style={{ color:'var(--text-2)' }}>{s.year || '—'}</td>
                      <td>{s.cgpa || '—'}</td>
                      <td>{s.leetcode_count ?? '—'}</td>
                      <td>
                        <span style={{ fontSize:12, color:'var(--text-2)' }}>
                          {s.skills?.length || 0} skill{(s.skills?.length||0)!==1?'s':''}
                        </span>
                      </td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div className="progress-bar-track" style={{ width:70 }}>
                            <div className="progress-bar-fill" style={{
                              width:`${s.readiness_score||0}%`,
                              background: (s.readiness_score||0) >= 70 ? 'var(--success)' : (s.readiness_score||0) >= 40 ? 'var(--warning)' : 'var(--danger)'
                            }} />
                          </div>
                          <span style={{ fontSize:12, color:'var(--text-2)', minWidth:32 }}>{Math.round(s.readiness_score||0)}%</span>
                        </div>
                      </td>
                      <td>
                        <button onClick={() => viewStudent(s.id)} style={{
                          fontSize:12, color:'var(--brand)', background:'var(--brand-light)',
                          border:'none', borderRadius:6, padding:'5px 12px', cursor:'pointer', fontWeight:500
                        }}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detail panel */}
        {selected && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
            <div className="card" style={{ width:'100%', maxWidth:640, maxHeight:'88vh', overflowY:'auto', padding:28 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
                <div style={{ fontFamily:'Sora,sans-serif', fontSize:18, fontWeight:600 }}>Student Profile</div>
                <button onClick={() => { setSelected(null); setDetail(null) }} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'var(--text-3)' }}>×</button>
              </div>

              {!detail ? (
                <div style={{ display:'flex', justifyContent:'center', padding:40 }}><div className="spinner" /></div>
              ) : (
                <div>

                  {/* Info */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
                    {[
                      { label:'Name', value: detail.name },
                      { label:'Department', value: detail.department },
                      { label:'Year', value: detail.year },
                      { label:'Section', value: detail.section },
                      { label:'CGPA', value: detail.cgpa },
                      { label:'LeetCode', value: `${detail.leetcode_count} problems` },
                      { label:'HackerRank', value: `${detail.hackerrank_score} pts` },
                      { label:'Readiness', value: `${Math.round(detail.readiness_score||0)}%` },
                    ].map(row => (
                      <div key={row.label} style={{ display:'flex', padding:'9px 0', borderBottom:'1px solid var(--border)' }}>
                        <span style={{ width:110, fontSize:13, color:'var(--text-3)' }}>{row.label}</span>
                        <span style={{ fontSize:13, fontWeight:500 }}>{row.value || '—'}</span>
                      </div>
                    ))}
                  </div>

                  {/* Skills */}
                  {detail.skills?.length > 0 && (
                    <div style={{ marginTop:18 }}>
                      <div style={{ fontSize:12, fontWeight:500, color:'var(--text-3)', marginBottom:8 }}>SKILLS</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                        {detail.skills.map(s => <span key={s.skill_name} className="badge badge-info">{s.skill_name}</span>)}
                      </div>
                    </div>
                  )}

                  {/* ✅ NEW: Skill Gap Section */}
                  {detail.companies?.length > 0 && (
                    <div style={{ marginTop: 20 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
                        Skill Gap by Company
                      </div>

                      {detail.companies.map(company => {
                        let gap = {}
                        try {
                          gap = typeof company.skill_gap === 'string'
                            ? JSON.parse(company.skill_gap || '{}')
                            : (company.skill_gap || {})
                        } catch {
                          gap = {}
                        }

                        const missing = Object.entries(gap).filter(([, d]) => !d.has_skill)
                        const present = Object.entries(gap).filter(([, d]) => d.has_skill)

                        return (
                          <div key={company.company_name} style={{
                            marginBottom: 12, padding: '14px 16px',
                            borderRadius: 10, border: '1px solid #e2e8f0',
                            background: company.status === 'eligible' ? '#f0fdf4'
                              : company.status === 'near_eligible' ? '#fffbeb' : '#fef2f2'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                              <span style={{ fontWeight: 700 }}>{company.company_name}</span>
                              <span style={{
                                fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                                color: company.status === 'eligible' ? '#16a34a' : company.status === 'near_eligible' ? '#d97706' : '#dc2626',
                                background: company.status === 'eligible' ? '#dcfce7' : company.status === 'near_eligible' ? '#fef3c7' : '#fee2e2',
                              }}>
                                {company.status.replace('_', ' ')}
                              </span>
                            </div>

                            {missing.length > 0 && (
                              <div style={{ marginBottom: 6 }}>
                                <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>Missing: </span>
                                {missing.map(([skill]) => (
                                  <span key={skill} style={{
                                    fontSize: 11, padding: '2px 8px', borderRadius: 20, marginRight: 4,
                                    background: '#fef2f2', color: '#dc2626'
                                  }}>{skill}</span>
                                ))}
                              </div>
                            )}

                            {present.length > 0 && (
                              <div>
                                <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Has: </span>
                                {present.map(([skill]) => (
                                  <span key={skill} style={{
                                    fontSize: 11, padding: '2px 8px', borderRadius: 20, marginRight: 4,
                                    background: '#f0fdf4', color: '#16a34a'
                                  }}>{skill}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}