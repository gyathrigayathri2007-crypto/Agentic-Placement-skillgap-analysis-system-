import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import api from '../api/axios'

const STATUS_CONFIG = {
  eligible:      { cls: 'badge-success', label: '✓ Eligible',      color: '#1D9E75' },
  near_eligible: { cls: 'badge-warning', label: '⚡ Near Eligible', color: '#BA7517' },
  not_eligible:  { cls: 'badge-danger',  label: '✗ Not Eligible',  color: '#e24b4a' },
  unknown:       { cls: 'badge-gray',    label: '— Not Analyzed',  color: '#8fa0b0' },
}

function CompanyCard({ company, eligibility }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = eligibility ? (STATUS_CONFIG[eligibility.status] || STATUS_CONFIG.unknown) : STATUS_CONFIG.unknown

  // parse skill_gap safely
  let skillGap = eligibility?.skill_gap || {}
  if (typeof skillGap === 'string') { try { skillGap = JSON.parse(skillGap) } catch { skillGap = {} } }

  const requiredSkills = Array.isArray(company.required_skills)
    ? company.required_skills
    : (company.required_skills ? String(company.required_skills).split(',') : [])

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', transition: 'box-shadow 0.15s' }}>
      {/* Card header */}
      <div style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏢</div>
            <div>
              <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--text-1)' }}>{company.name}</div>
              {company.package && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>💰 {company.package}</div>}
            </div>
          </div>
          <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
        </div>

        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>
          {company.cgpa_cutoff && <span>🎓 Min CGPA: <strong>{company.cgpa_cutoff}</strong></span>}
          {company.aptitude_requirement && <span>📝 Aptitude required</span>}
        </div>

        {/* Required skills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
          {requiredSkills.slice(0, 5).map((s, i) => (
            <span key={i} className="badge badge-info" style={{ fontSize: 11 }}>{s.trim()}</span>
          ))}
          {requiredSkills.length > 5 && (
            <span style={{ fontSize: 11, color: 'var(--text-3)', padding: '2px 6px' }}>+{requiredSkills.length - 5} more</span>
          )}
        </div>

        <button
          onClick={() => setExpanded(e => !e)}
          style={{ fontSize: 12, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}
        >
          {expanded ? '▲ Hide details' : '▼ View details & skill gap'}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', background: '#fafbfc' }}>

          {/* Full required skills */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>ALL REQUIRED SKILLS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {requiredSkills.map((s, i) => (
                <span key={i} className="badge badge-info">{s.trim()}</span>
              ))}
            </div>
          </div>

          {/* Aptitude */}
          {company.aptitude_requirement && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>APTITUDE REQUIREMENT</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{company.aptitude_requirement}</div>
            </div>
          )}

          {/* Skill Gap */}
          {eligibility && Object.keys(skillGap).length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>YOUR SKILL GAP</div>
              {Object.entries(skillGap).map(([skill, d]) => {
                const has = d.has_skill || false
                const studentLvl = d.student_level ?? (has ? 60 : 0)
                const required = d.required_level ?? d.required ?? 85
                return (
                  <div key={skill} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span style={{ fontWeight: 500, color: 'var(--text-1)' }}>
                        {has ? '✓' : '✗'} {skill}
                      </span>
                      <span style={{ color: has ? 'var(--success)' : 'var(--danger)' }}>
                        {has ? 'You have this skill' : 'Missing skill'}
                      </span>
                    </div>
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{
                        width: `${studentLvl}%`,
                        background: has ? 'var(--success)' : 'var(--danger)'
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {eligibility && Object.keys(skillGap).length === 0 && (
            <div className="alert alert-success" style={{ fontSize: 12 }}>
              🎉 You meet all skill requirements for this company!
            </div>
          )}

          {!eligibility && (
            <div className="alert alert-info" style={{ fontSize: 12 }}>
              Submit your profile first so AI can analyze your eligibility for this company.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CompaniesPage() {
  const [companies,    setCompanies]    = useState([])
  const [eligibility,  setEligibility]  = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [filter,       setFilter]       = useState('all')

  useEffect(() => {
    Promise.all([
      api.get('/companies/'),
      api.get('/students/dashboard').catch(() => ({ data: { companies: [] } }))
    ]).then(([compRes, dashRes]) => {
      setCompanies(compRes.data || [])
      setEligibility(dashRes.data?.companies || [])
    }).finally(() => setLoading(false))
  }, [])

  // Map eligibility by company_id for quick lookup
  const eligMap = {}
  eligibility.forEach(e => { eligMap[e.company_id] = e })

  const filtered = companies.filter(c => {
    const elig = eligMap[c.id]
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.required_skills || []).some(s => s.toLowerCase().includes(search.toLowerCase()))
    const matchFilter = filter === 'all' ||
      (filter === 'eligible'      && elig?.status === 'eligible') ||
      (filter === 'near_eligible' && elig?.status === 'near_eligible') ||
      (filter === 'not_eligible'  && elig?.status === 'not_eligible') ||
      (filter === 'unknown'       && !elig)
    return matchSearch && matchFilter
  })

  // Summary counts
  const counts = {
    eligible:      eligibility.filter(e => e.status === 'eligible').length,
    near_eligible: eligibility.filter(e => e.status === 'near_eligible').length,
    not_eligible:  eligibility.filter(e => e.status === 'not_eligible').length,
  }

  if (loading) return (
    <div className="app-shell">
      <Sidebar role="student" />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </main>
    </div>
  )

  return (
    <div className="app-shell">
      <Sidebar role="student" />
      <main className="main-content">

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--text-1)' }}>Companies</div>
          <div style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 4 }}>Browse all companies and check your eligibility</div>
        </div>

        {/* Summary cards */}
        {eligibility.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Eligible',      count: counts.eligible,      color: 'var(--success)', icon: '✅' },
              { label: 'Near Eligible', count: counts.near_eligible, color: 'var(--warning)', icon: '⚡' },
              { label: 'Not Eligible',  count: counts.not_eligible,  color: 'var(--danger)',  icon: '❌' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.count}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input className="sp-input" style={{ paddingLeft: 34 }} placeholder="Search by company or skill…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { key: 'all',           label: `All (${companies.length})` },
              { key: 'eligible',      label: '✓ Eligible' },
              { key: 'near_eligible', label: '⚡ Near' },
              { key: 'not_eligible',  label: '✗ Not Eligible' },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12,
                cursor: 'pointer', background: filter === f.key ? 'var(--brand)' : '#fff',
                color: filter === f.key ? '#fff' : 'var(--text-2)',
                fontWeight: filter === f.key ? 500 : 400, transition: 'all 0.15s'
              }}>{f.label}</button>
            ))}
          </div>
        </div>

        {/* Company cards */}
        {filtered.length === 0 ? (
          <div className="alert alert-info">No companies found. {companies.length === 0 ? 'Ask your faculty to add companies.' : 'Try a different filter.'}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map(c => (
              <CompanyCard key={c.id} company={c} eligibility={eligMap[c.id] || null} />
            ))}
          </div>
        )}

      </main>
    </div>
  )
}