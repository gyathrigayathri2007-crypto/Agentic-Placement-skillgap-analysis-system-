import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import api from '../api/axios'

const emptyForm = { name:'', cgpa_cutoff:'', package:'', required_skills:[], aptitude_requirement:'', certifications_required:'' }

export default function FacultyCompanies() {
  const [companies, setCompanies] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState(emptyForm)
  const [editId,    setEditId]    = useState(null)
  const [skillInput,setSkillInput]= useState('')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  const load = () => {
    api.get('/companies/').then(res => setCompanies(res.data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const addSkill = () => {
    const v = skillInput.trim()
    if (v && !form.required_skills.includes(v)) setForm(f => ({ ...f, required_skills:[...f.required_skills, v] }))
    setSkillInput('')
  }
  const removeSkill = i => setForm(f => ({ ...f, required_skills: f.required_skills.filter((_,idx)=>idx!==i) }))

  const openAdd  = () => { setForm(emptyForm); setEditId(null); setShowForm(true); setError('') }
  const openEdit = (c) => {
    setForm({ name:c.name, cgpa_cutoff:c.cgpa_cutoff, package:c.package||'', required_skills:c.required_skills||[], aptitude_requirement:c.aptitude_requirement||'', certifications_required:c.certifications_required||'' })
    setEditId(c.id); setShowForm(true); setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const payload = { ...form, cgpa_cutoff: parseFloat(form.cgpa_cutoff) }
      if (editId) await api.put(`/companies/${editId}`, payload)
      else        await api.post('/companies/', payload)
      setShowForm(false); load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save company.')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this company?')) return
    await api.delete(`/companies/${id}`)
    load()
  }

  return (
    <div className="app-shell">
      <Sidebar role="faculty" />
      <main className="main-content">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
          <div>
            <div style={{ fontFamily:'Sora,sans-serif', fontSize:22, fontWeight:700 }}>Companies</div>
            <div style={{ fontSize:14, color:'var(--text-2)', marginTop:4 }}>Manage recruitment companies and their requirements</div>
          </div>
          <button className="btn-primary btn-sm" style={{ width:'auto' }} onClick={openAdd}>+ Add Company</button>
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:60 }}><div className="spinner" /></div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
            {companies.length === 0 && (
              <div className="alert alert-info">No companies yet. Add your first company to start matching students.</div>
            )}
            {companies.map(c => (
              <div key={c.id} className="card" style={{ padding:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div style={{ fontFamily:'Sora,sans-serif', fontSize:16, fontWeight:600 }}>{c.name}</div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => openEdit(c)} style={{ fontSize:12, color:'var(--brand)', background:'var(--brand-light)', border:'none', borderRadius:6, padding:'4px 10px', cursor:'pointer' }}>Edit</button>
                    <button onClick={() => handleDelete(c.id)} style={{ fontSize:12, color:'var(--danger)', background:'var(--danger-bg)', border:'none', borderRadius:6, padding:'4px 10px', cursor:'pointer' }}>Delete</button>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:7, fontSize:13, color:'var(--text-2)' }}>
                  <div>📊 Min CGPA: <strong>{c.cgpa_cutoff}</strong></div>
                  {c.package && <div>📦 Package: <strong>{c.package}</strong></div>}
                </div>
                {c.required_skills?.length > 0 && (
                  <div style={{ marginTop:12, display:'flex', flexWrap:'wrap', gap:5 }}>
                    {c.required_skills.map(s => <span key={s} className="badge badge-info">{s}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showForm && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
            <div className="card" style={{ width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', padding:28 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
                <div style={{ fontFamily:'Sora,sans-serif', fontSize:17, fontWeight:600 }}>{editId ? 'Edit Company' : 'Add Company'}</div>
                <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--text-3)' }}>×</button>
              </div>

              {error && <div className="alert alert-error" style={{ marginBottom:14 }}>{error}</div>}

              <form onSubmit={handleSubmit}>
                {[
                  { key:'name',         label:'Company Name',  placeholder:'e.g. TCS',         type:'text',   required:true },
                  { key:'cgpa_cutoff',  label:'Min CGPA',      placeholder:'e.g. 7.5',          type:'number', required:true },
                  { key:'package',      label:'Package (LPA)', placeholder:'e.g. 6-8 LPA',      type:'text',   required:false },
                  { key:'aptitude_requirement',    label:'Aptitude Requirement', placeholder:'Describe aptitude requirements…', type:'text', required:false },
                  { key:'certifications_required', label:'Certifications Required', placeholder:'e.g. AWS Certified, etc.', type:'text', required:false },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom:14 }}>
                    <label style={{ display:'block', fontSize:13, fontWeight:500, color:'var(--text-2)', marginBottom:6 }}>{f.label}</label>
                    <input className="sp-input" type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={set(f.key)} required={f.required} step={f.type==='number'?'0.1':undefined} />
                  </div>
                ))}

                {/* Skills */}
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:'block', fontSize:13, fontWeight:500, color:'var(--text-2)', marginBottom:6 }}>Required Skills</label>
                  <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                    <input className="sp-input" style={{ flex:1 }} placeholder="e.g. Python"
                      value={skillInput} onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={e => e.key==='Enter' && (e.preventDefault(), addSkill())} />
                    <button type="button" onClick={addSkill} style={{ height:42, padding:'0 14px', background:'var(--brand-light)', color:'var(--brand)', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:500 }}>Add</button>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {form.required_skills.map((s,i) => (
                      <span key={i} className="chip">{s} <span className="chip-remove" onClick={() => removeSkill(i)}>×</span></span>
                    ))}
                  </div>
                </div>

                <button className="btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Saving…' : editId ? 'Save Changes' : 'Add Company'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}