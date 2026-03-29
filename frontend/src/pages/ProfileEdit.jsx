import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import api from '../api/axios'

/* ─── Chip Tag Input ─── */
function ChipInput({ label, placeholder, items, onChange }) {
  const [val, setVal] = useState('')
  const add = () => {
    const v = val.trim()
    if (v && !items.includes(v)) onChange([...items, v])
    setVal('')
  }
  const remove = i => onChange(items.filter((_, idx) => idx !== i))
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          className="sp-input" style={{ flex: 1 }} placeholder={placeholder}
          value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
        />
        <button type="button" onClick={add} style={addBtnStyle}>Add</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map((item, i) => (
          <span key={i} className="chip">
            {item} <span className="chip-remove" onClick={() => remove(i)}>×</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function SectionHeader({ icon, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>
        {icon}
      </div>
      <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>{title}</div>
    </div>
  )
}

const labelStyle  = { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }
const addBtnStyle = { height: 42, padding: '0 16px', background: 'var(--brand-light)', color: 'var(--brand)', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap' }
const emptyProject    = () => ({ title: '', description: '' })
const emptyInternship = () => ({ company: '', role: '' })

export default function ProfileEdit() {
  const navigate = useNavigate()
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)

  const [info, setInfo] = useState({
    name: '', department: '', year: '', section: '', cgpa: '',
    leetcode_count: '', hackerrank_score: '', codechef_rating: '', codeforces_rating: ''
  })
  const [skills,      setSkills]      = useState([])
  const [projects,    setProjects]    = useState([emptyProject()])
  const [internships, setInternships] = useState([emptyInternship()])

  // Load existing profile
  useEffect(() => {
    api.get('/students/profile')
      .then(res => {
        const p = res.data
        setInfo({
          name:              p.name              || '',
          department:        p.department        || '',
          year:              p.year              || '',
          section:           p.section           || '',
          cgpa:              p.cgpa              || '',
          leetcode_count:    p.leetcode_count    || '',
          hackerrank_score:  p.hackerrank_score  || '',
          codechef_rating:   p.codechef_rating   || '',
          codeforces_rating: p.codeforces_rating || '',
        })
        setSkills((p.skills || []).map(s => s.skill_name || s))
        setProjects(p.projects?.length > 0 ? p.projects : [emptyProject()])
        setInternships(p.internships?.length > 0 ? p.internships : [emptyInternship()])
      })
      .catch(() => navigate('/setup'))
      .finally(() => setLoading(false))
  }, [])

  const setI = k => e => setInfo(f => ({ ...f, [k]: e.target.value }))

  const addProject       = () => setProjects(p => [...p, emptyProject()])
  const addInternship    = () => setInternships(p => [...p, emptyInternship()])
  const updateProject    = (i, k, v) => setProjects(p => p.map((x, idx) => idx === i ? { ...x, [k]: v } : x))
  const updateInternship = (i, k, v) => setInternships(p => p.map((x, idx) => idx === i ? { ...x, [k]: v } : x))
  const removeProject    = i => setProjects(p => p.filter((_, idx) => idx !== i))
  const removeInternship = i => setInternships(p => p.filter((_, idx) => idx !== i))

  const handleSave = async () => {
    setError('')
    setSuccess(false)
    if (!info.name.trim())   return setError('Please enter your full name.')
    if (!info.cgpa)          return setError('Please enter your CGPA.')
    if (skills.length === 0) return setError('Please add at least one skill.')

    setSaving(true)
    try {
      const payload = {
        ...info,
        cgpa:              parseFloat(info.cgpa) || 0,
        leetcode_count:    parseInt(info.leetcode_count) || 0,
        hackerrank_score:  parseInt(info.hackerrank_score) || 0,
        codechef_rating:   parseInt(info.codechef_rating) || null,
        codeforces_rating: parseInt(info.codeforces_rating) || null,
        skills:      skills.map(s => ({ skill_name: s })),
        projects:    projects.filter(p => p.title.trim()),
        internships: internships.filter(i => i.company.trim()),
      }
      await api.put('/students/profile', payload)
      setSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
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
        <div style={{ maxWidth: 700 }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <button onClick={() => navigate('/dashboard')} style={{ fontSize: 13, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 10, padding: 0 }}>
              ← Back to Dashboard
            </button>
            <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--text-1)' }}>Edit Profile</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>Updating your profile will re-run the AI analysis</div>
          </div>

          {success && (
            <div className="alert alert-success" style={{ marginBottom: 20 }}>
              ✅ Profile updated! AI is re-analyzing your profile. Check your dashboard for updated results.
            </div>
          )}

          {/* Basic Details */}
          <div className="card" style={{ padding: '24px 24px 20px', marginBottom: 16 }}>
            <SectionHeader icon="👤" title="Basic Details" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Full Name</label>
                <input className="sp-input" placeholder="Arun Kumar" value={info.name} onChange={setI('name')} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Department</label>
                <input className="sp-input" placeholder="Computer Science" value={info.department} onChange={setI('department')} />
              </div>
              <div>
                <label style={labelStyle}>Year</label>
                <select className="sp-input" value={info.year} onChange={setI('year')}>
                  <option value="">Select year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Section</label>
                <input className="sp-input" placeholder="A" value={info.section} onChange={setI('section')} />
              </div>
              <div>
                <label style={labelStyle}>CGPA</label>
                <input className="sp-input" type="number" step="0.01" min="0" max="10" placeholder="8.5" value={info.cgpa} onChange={setI('cgpa')} />
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="card" style={{ padding: '24px 24px 20px', marginBottom: 16 }}>
            <SectionHeader icon="⚡" title="Technical Skills" />
            <ChipInput label="Skills" placeholder="e.g. Python, React, SQL…" items={skills} onChange={setSkills} />
          </div>

          {/* Projects */}
          <div className="card" style={{ padding: '24px 24px 20px', marginBottom: 16 }}>
            <SectionHeader icon="🚀" title="Projects" />
            {projects.map((p, i) => (
              <div key={i} style={{ marginBottom: 14, padding: 16, background: '#fafbfc', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>Project {i + 1}</span>
                  {projects.length > 1 && (
                    <button onClick={() => removeProject(i)} style={{ fontSize: 12, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                  )}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={labelStyle}>Title</label>
                  <input className="sp-input" placeholder="Project title" value={p.title} onChange={e => updateProject(i, 'title', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea className="sp-input" rows={2} placeholder="Brief description…" value={p.description} onChange={e => updateProject(i, 'description', e.target.value)} />
                </div>
              </div>
            ))}
            <button type="button" onClick={addProject} style={{ fontSize: 13, color: 'var(--brand)', background: 'none', border: '1px dashed #c5d9f5', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', width: '100%' }}>
              + Add project
            </button>
          </div>

          {/* Internships */}
          <div className="card" style={{ padding: '24px 24px 20px', marginBottom: 16 }}>
            <SectionHeader icon="💼" title="Internships" />
            {internships.map((inn, i) => (
              <div key={i} style={{ marginBottom: 14, padding: 16, background: '#fafbfc', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>Internship {i + 1}</span>
                  {internships.length > 1 && (
                    <button onClick={() => removeInternship(i)} style={{ fontSize: 12, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Company</label>
                    <input className="sp-input" placeholder="TCS" value={inn.company} onChange={e => updateInternship(i, 'company', e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Role</label>
                    <input className="sp-input" placeholder="Software Intern" value={inn.role} onChange={e => updateInternship(i, 'role', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addInternship} style={{ fontSize: 13, color: 'var(--brand)', background: 'none', border: '1px dashed #c5d9f5', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', width: '100%' }}>
              + Add internship
            </button>
          </div>

          {/* Coding Platforms */}
          <div className="card" style={{ padding: '24px 24px 20px', marginBottom: 16 }}>
            <SectionHeader icon="💻" title="Coding Platforms" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>LeetCode Problems</label>
                <input className="sp-input" type="number" placeholder="150" value={info.leetcode_count} onChange={setI('leetcode_count')} />
              </div>
              <div>
                <label style={labelStyle}>HackerRank Score</label>
                <input className="sp-input" type="number" placeholder="200" value={info.hackerrank_score} onChange={setI('hackerrank_score')} />
              </div>
              <div>
                <label style={labelStyle}>CodeChef Rating <span style={{ fontSize: 11, color: 'var(--text-3)' }}>(optional)</span></label>
                <input className="sp-input" type="number" placeholder="1500" value={info.codechef_rating} onChange={setI('codechef_rating')} />
              </div>
              <div>
                <label style={labelStyle}>Codeforces Rating <span style={{ fontSize: 11, color: 'var(--text-3)' }}>(optional)</span></label>
                <input className="sp-input" type="number" placeholder="1200" value={info.codeforces_rating} onChange={setI('codeforces_rating')} />
              </div>
            </div>
          </div>

          {/* Save */}
          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

          <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
            <button onClick={() => navigate('/dashboard')} style={{ flex: 1, height: 44, border: '1px solid var(--border)', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14, color: 'var(--text-2)' }}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 2, height: 44, fontSize: 14, fontWeight: 600 }}>
              {saving ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span className="spinner" style={{ width: 16, height: 16 }} /> Re-running AI analysis…
                </span>
              ) : '💾 Save & Re-analyze'}
            </button>
          </div>

        </div>
      </main>
    </div>
  )
}