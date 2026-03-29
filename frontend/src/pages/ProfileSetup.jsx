import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const PREDEFINED_SKILLS = [
  "Python", "Java", "C++", "C#", "JavaScript", "TypeScript", "React", "Angular", "Vue", "Node.js",
  "Django", "Flask", "Spring Boot", "Express", "SQL", "MongoDB", "PostgreSQL", "MySQL", "Redis", "AWS",
  "Azure", "Google Cloud", "Docker", "Kubernetes", "Git", "Linux", "Machine Learning", "Data Science", "Data Structures", "Algorithms"
]

/* ─── Predefined Skills Input ─── */
function SkillsSelector({ items, onChange }) {
  const toggleSkill = (skill) => {
    if (items.includes(skill)) {
      onChange(items.filter(s => s !== skill))
    } else {
      onChange([...items, skill])
    }
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={labelStyle}>Skills Selection * (Click to select)</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {PREDEFINED_SKILLS.map(skill => {
          const isSelected = items.includes(skill)
          return (
            <span 
              key={skill} 
              onClick={() => toggleSkill(skill)}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 13,
                cursor: 'pointer',
                border: isSelected ? '1px solid var(--brand)' : '1px solid var(--border)',
                background: isSelected ? 'var(--brand-light)' : '#fff',
                color: isSelected ? 'var(--brand)' : 'var(--text-2)',
                fontWeight: isSelected ? 600 : 400,
                transition: 'all 0.2s ease',
                userSelect: 'none'
              }}
            >
              {skill}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 16, fontWeight: 600, color: 'var(--text-1)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{subtitle}</div>}
      </div>
    </div>
  )
}

const labelStyle  = { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }
const addBtnStyle = { height: 42, padding: '0 16px', background: 'var(--brand-light)', color: 'var(--brand)', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap' }
const emptyProject    = () => ({ title: '', description: '' })
const emptyInternship = () => ({ company: '', role: '' })

// Flatten FastAPI validation errors into a readable string
function parseApiError(err) {
  const detail = err.response?.data?.detail
  if (!detail) return 'Failed to save profile. Please try again.'
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map(d => {
      if (typeof d === 'string') return d
      if (d.msg) return `${d.loc ? d.loc.join(' → ') + ': ' : ''}${d.msg}`
      return JSON.stringify(d)
    }).join(' | ')
  }
  return 'Failed to save profile. Please try again.'
}

export default function ProfileSetup() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [agreed,  setAgreed]  = useState(false)

  const [info, setInfo] = useState({
    name: '', department: '', year: '', section: '', cgpa: '',
    leetcode_count: '', hackerrank_score: '', codechef_rating: '', codeforces_rating: ''
  })
  const [skills,      setSkills]      = useState([])
  const [projects,    setProjects]    = useState([emptyProject()])
  const [internships, setInternships] = useState([emptyInternship()])

  const setI = k => e => setInfo(f => ({ ...f, [k]: e.target.value }))

  const addProject       = () => setProjects(p => [...p, emptyProject()])
  const addInternship    = () => setInternships(p => [...p, emptyInternship()])
  const updateProject    = (i, k, v) => setProjects(p => p.map((x, idx) => idx === i ? { ...x, [k]: v } : x))
  const updateInternship = (i, k, v) => setInternships(p => p.map((x, idx) => idx === i ? { ...x, [k]: v } : x))
  const removeProject    = i => setProjects(p => p.filter((_, idx) => idx !== i))
  const removeInternship = i => setInternships(p => p.filter((_, idx) => idx !== i))

  const handleSubmit = async () => {
    setError('')

    // Frontend validation
    if (!info.name.trim())       return setError('Please enter your full name.')
    if (!info.department.trim()) return setError('Please enter your department.')
    if (!info.year.trim())       return setError('Please select your year.')
    if (!info.cgpa)              return setError('Please enter your CGPA.')
    if (skills.length === 0)     return setError('Please add at least one skill.')
    if (!agreed)                 return setError('Please agree to the terms and conditions.')

    setLoading(true)
    try {
      const payload = {
        name:              info.name.trim(),
        department:        info.department.trim(),
        year:              info.year.trim(),
        section:           info.section.trim(),
        cgpa:              parseFloat(info.cgpa) || 0,
        leetcode_count:    parseInt(info.leetcode_count) || 0,
        hackerrank_score:  parseInt(info.hackerrank_score) || 0,
        codechef_rating:   info.codechef_rating   ? parseInt(info.codechef_rating)   : null,
        codeforces_rating: info.codeforces_rating ? parseInt(info.codeforces_rating) : null,
        resume_url:        null,
        certification_urls: null,
        // ✅ Send plain strings — backend expects List[str]
        skills:      skills,
        projects:    projects.filter(p => p.title.trim()).map(p => ({ title: p.title.trim(), description: p.description.trim() })),
        internships: internships.filter(i => i.company.trim()).map(i => ({ company: i.company.trim(), role: i.role.trim() })),
      }

      console.log('[ProfileSetup] Submitting payload:', payload)
      await api.post('/students/profile', payload)

      // AI pipeline runs in background on server — redirect to dashboard
      // Dashboard will show a "AI is analyzing" banner if readiness_score is still 0
      navigate('/dashboard')

    } catch (err) {
      console.error('[ProfileSetup] Error:', err.response?.data)
      setError(parseApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--brand-light)', borderRadius: 20, padding: '6px 14px', marginBottom: 14 }}>
            <span style={{ fontSize: 14 }}>🤖</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--brand)' }}>AI-Powered Placement Matching</span>
          </div>
          <h1 style={{ fontFamily: 'Sora,sans-serif', fontSize: 26, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>
            Complete Your Profile
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', maxWidth: 440, margin: '0 auto' }}>
            Fill in your details below. Our AI will analyze your profile and match you with the best companies.
          </p>
        </div>

        {/* ── SECTION 1: Basic Details ── */}
        <div className="card" style={{ padding: '28px 28px 24px', marginBottom: 20 }}>
          <SectionHeader icon="👤" title="Basic Details" subtitle="Your personal and academic information" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Full Name <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input className="sp-input" placeholder="e.g. Arun Kumar" value={info.name} onChange={setI('name')} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Department <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input className="sp-input" placeholder="e.g. Computer Science and Engineering" value={info.department} onChange={setI('department')} />
            </div>
            <div>
              <label style={labelStyle}>Year <span style={{ color: 'var(--danger)' }}>*</span></label>
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
              <input className="sp-input" placeholder="e.g. A" value={info.section} onChange={setI('section')} />
            </div>
          </div>
        </div>

        {/* ── SECTION 2: Academic ── */}
        <div className="card" style={{ padding: '28px 28px 24px', marginBottom: 20 }}>
          <SectionHeader icon="🎓" title="Academic Performance" subtitle="Your CGPA is used to match company cutoffs" />
          <div style={{ maxWidth: 280 }}>
            <label style={labelStyle}>CGPA (out of 10) <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input className="sp-input" type="number" step="0.01" min="0" max="10" placeholder="e.g. 8.5" value={info.cgpa} onChange={setI('cgpa')} />
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>Enter your current CGPA on a 10-point scale</div>
          </div>
        </div>

        {/* ── SECTION 3: Skills ── */}
        <div className="card" style={{ padding: '28px 28px 24px', marginBottom: 20 }}>
          <SectionHeader icon="⚡" title="Technical Skills" subtitle="Select your best skills from the list below" />
          <SkillsSelector items={skills} onChange={setSkills} />
          {skills.length === 0 && (
            <div className="alert alert-info" style={{ marginTop: 4 }}>
              💡 Add at least 3–5 skills for better AI matching accuracy
            </div>
          )}
          {skills.length > 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
              {skills.length} skill{skills.length > 1 ? 's' : ''} added
            </div>
          )}
        </div>

        {/* ── SECTION 4: Projects ── */}
        <div className="card" style={{ padding: '28px 28px 24px', marginBottom: 20 }}>
          <SectionHeader icon="🚀" title="Projects" subtitle="Add your best projects to showcase your work" />
          {projects.map((p, i) => (
            <div key={i} style={{ marginBottom: 16, padding: 18, background: '#fafbfc', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>Project {i + 1}</span>
                {projects.length > 1 && (
                  <button onClick={() => removeProject(i)} style={{ fontSize: 12, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 8px' }}>Remove</button>
                )}
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Project Title</label>
                <input className="sp-input" placeholder="e.g. AI Chat App" value={p.title} onChange={e => updateProject(i, 'title', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea className="sp-input" rows={2} placeholder="Brief description — tech stack, what it does, impact…" value={p.description} onChange={e => updateProject(i, 'description', e.target.value)} style={{ resize: 'vertical' }} />
              </div>
            </div>
          ))}
          <button type="button" onClick={addProject} style={{ fontSize: 13, color: 'var(--brand)', background: 'none', border: '1px dashed #c5d9f5', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', width: '100%' }}>
            + Add another project
          </button>
        </div>

        {/* ── SECTION 5: Internships ── */}
        <div className="card" style={{ padding: '28px 28px 24px', marginBottom: 20 }}>
          <SectionHeader icon="💼" title="Internships" subtitle="Leave empty if you have no internship experience" />
          {internships.map((inn, i) => (
            <div key={i} style={{ marginBottom: 16, padding: 18, background: '#fafbfc', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>Internship {i + 1}</span>
                {internships.length > 1 && (
                  <button onClick={() => removeInternship(i)} style={{ fontSize: 12, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 8px' }}>Remove</button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Company</label>
                  <input className="sp-input" placeholder="e.g. TCS, Infosys" value={inn.company} onChange={e => updateInternship(i, 'company', e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Role</label>
                  <input className="sp-input" placeholder="e.g. Software Intern" value={inn.role} onChange={e => updateInternship(i, 'role', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addInternship} style={{ fontSize: 13, color: 'var(--brand)', background: 'none', border: '1px dashed #c5d9f5', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', width: '100%' }}>
            + Add another internship
          </button>
        </div>

        {/* ── SECTION 6: Coding Platforms ── */}
        <div className="card" style={{ padding: '28px 28px 24px', marginBottom: 20 }}>
          <SectionHeader icon="💻" title="Coding Platforms" subtitle="These scores boost your readiness score" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>LeetCode Problems Solved</label>
              <input className="sp-input" type="number" min="0" placeholder="e.g. 150" value={info.leetcode_count} onChange={setI('leetcode_count')} />
            </div>
            <div>
              <label style={labelStyle}>HackerRank Score</label>
              <input className="sp-input" type="number" min="0" placeholder="e.g. 200" value={info.hackerrank_score} onChange={setI('hackerrank_score')} />
            </div>
            <div>
              <label style={labelStyle}>CodeChef Rating <span style={{ fontSize: 11, color: 'var(--text-3)' }}>(optional)</span></label>
              <input className="sp-input" type="number" min="0" placeholder="e.g. 1500" value={info.codechef_rating} onChange={setI('codechef_rating')} />
            </div>
            <div>
              <label style={labelStyle}>Codeforces Rating <span style={{ fontSize: 11, color: 'var(--text-3)' }}>(optional)</span></label>
              <input className="sp-input" type="number" min="0" placeholder="e.g. 1200" value={info.codeforces_rating} onChange={setI('codeforces_rating')} />
            </div>
          </div>
        </div>

        {/* ── SECTION 7: Uploads (Placeholder) ── */}
        <div className="card" style={{ padding: '28px 28px 24px', marginBottom: 20 }}>
          <SectionHeader icon="📎" title="Document Uploads" subtitle="Coming soon — Cloudinary integration in progress" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {['Resume (PDF)', 'Certifications'].map(label => (
              <div key={label} style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: '24px 16px', textAlign: 'center', background: '#fafbfc', opacity: 0.65 }}>
                <div style={{ fontSize: 26, marginBottom: 6 }}>{label.includes('Resume') ? '📄' : '🏅'}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Upload coming soon</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SECTION 8: Terms & Submit ── */}
        <div className="card" style={{ padding: '28px 28px 24px' }}>
          <SectionHeader icon="🤖" title="AI Analysis & Submit" subtitle="Your profile will be analyzed by our Agentic AI" />

          {/* What happens box */}
          <div style={{ background: 'var(--brand-light)', borderRadius: 10, padding: '16px 18px', marginBottom: 24, border: '1px solid #c5d9f5' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)', marginBottom: 8 }}>What happens after you submit?</div>
            {[
              '🔍 AI analyzes your profile against all registered companies',
              '📊 Eligibility status calculated (Eligible / Near Eligible / Not Eligible)',
              '🎯 Skill gap analysis generated per company',
              '🗺️ Personalized learning roadmaps created by Gemini AI',
              '📈 Readiness score computed (0–100%)',
            ].map((s, i) => (
              <div key={i} style={{ fontSize: 12, color: '#2a5a8c', marginBottom: 4 }}>{s}</div>
            ))}
          </div>

          {/* Terms checkbox */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', marginBottom: 24 }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              style={{ marginTop: 2, width: 16, height: 16, accentColor: 'var(--brand)', cursor: 'pointer', flexShrink: 0 }}
            />
            <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
              I confirm that all details provided are <strong>true and verifiable</strong>. I understand that false information may affect my eligibility results.
            </span>
          </label>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              ⚠️ {error}
            </div>
          )}

          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading || !agreed}
            style={{ width: '100%', height: 48, fontSize: 15, fontWeight: 600, opacity: (!agreed || loading) ? 0.6 : 1, cursor: (!agreed || loading) ? 'not-allowed' : 'pointer' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <span className="spinner" style={{ width: 18, height: 18 }} />
                Saving profile &amp; starting AI analysis…
              </span>
            ) : '🚀 Submit & Run AI Analysis'}
          </button>

          {loading && (
            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginTop: 12 }}>
              This may take a moment. You'll be redirected to your dashboard automatically.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}