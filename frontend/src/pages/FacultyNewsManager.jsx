// frontend/src/pages/FacultyNewsManager.jsx
// Faculty page to create, edit, pin, and delete skill news posts.
// Add to Sidebar under faculty navigation as "Skill News".
// Route: /faculty/news

import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import api from '../api/axios'

const TYPE_OPTIONS = [
  { value: 'tip',            label: '💡 Skill tip' },
  { value: 'trend',          label: '📈 Industry trend' },
  { value: 'company_update', label: '🏢 Company update' },
  { value: 'alert',          label: '🚨 Urgent alert' },
]

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Low',    color: '#6b7280' },
  { value: 'medium', label: 'Medium', color: '#2563eb' },
  { value: 'high',   label: 'High',   color: '#d97706' },
  { value: 'urgent', label: 'Urgent', color: '#dc2626' },
]

const PRIORITY_COLOR = { urgent: '#dc2626', high: '#d97706', medium: '#2563eb', low: '#6b7280' }
const TYPE_LABEL     = { tip: '💡 Tip', trend: '📈 Trend', company_update: '🏢 Company', alert: '🚨 Alert' }

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// ── EMPTY FORM STATE ──────────────────────────────────────────
const emptyForm = {
  title:        '',
  body:         '',
  post_type:    'tip',
  priority:     'medium',
  skill_tag:    '',
  resource_url: '',
  is_pinned:    false,
}

export default function FacultyNewsManager() {
  const [posts,       setPosts]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [form,        setForm]        = useState(emptyForm)
  const [editingId,   setEditingId]   = useState(null)   // null = create mode
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState('')
  const [showForm,    setShowForm]    = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // ── Fetch posts ────────────────────────────────────────────
  const fetchPosts = () => {
    setLoading(true)
    api.get('/faculty/news?include_inactive=true')
      .then(res => setPosts(res.data.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchPosts() }, [])

  // ── Form helpers ───────────────────────────────────────────
  const handleField = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const openCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const openEdit = (post) => {
    setForm({
      title:        post.title,
      body:         post.body,
      post_type:    post.post_type,
      priority:     post.priority,
      skill_tag:    post.skill_tag || '',
      resource_url: post.resource_url || '',
      is_pinned:    post.is_pinned,
    })
    setEditingId(post.id)
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  // ── Submit (create or update) ──────────────────────────────
  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Title is required'); return }
    if (!form.body.trim())  { setError('Body is required');  return }

    setSubmitting(true)
    setError('')

    try {
      if (editingId) {
        await api.put(`/faculty/news/${editingId}`, form)
        setSuccess('Post updated')
      } else {
        await api.post('/faculty/news', form)
        setSuccess('Post created and visible to students')
      }
      fetchPosts()
      closeForm()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save post')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Pin toggle ─────────────────────────────────────────────
  const handlePin = async (postId) => {
    try {
      const res = await api.patch(`/faculty/news/${postId}/pin`)
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, is_pinned: res.data.is_pinned } : p
      ))
    } catch {}
  }

  // ── Soft delete ────────────────────────────────────────────
  const handleDelete = async (postId) => {
    try {
      await api.delete(`/faculty/news/${postId}`)
      setDeleteConfirm(null)
      fetchPosts()
      setSuccess('Post hidden from students')
    } catch {}
  }

  // ── Restore (un-hide) ──────────────────────────────────────
  const handleRestore = async (postId) => {
    try {
      await api.put(`/faculty/news/${postId}`, { is_active: true })
      fetchPosts()
    } catch {}
  }

  const activePosts   = posts.filter(p => p.is_active !== false)
  const inactivePosts = posts.filter(p => p.is_active === false)

  return (
    <div className="app-shell">
      <Sidebar role="faculty" />
      <main className="main-content">

        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', fontFamily: 'Sora, sans-serif' }}>
              Skill News Board
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 4 }}>
              Post skill tips, trends, and alerts. Students see these in their dashboard.
            </div>
          </div>
          <button
            onClick={openCreate}
            style={{
              padding: '10px 20px', background: '#0f172a', color: '#fff',
              border: 'none', borderRadius: 10, cursor: 'pointer',
              fontSize: 13, fontWeight: 700, fontFamily: 'Sora, sans-serif',
              flexShrink: 0,
            }}
          >
            + New Post
          </button>
        </div>

        {success && (
          <div style={{
            padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 8, fontSize: 13, color: '#16a34a', marginBottom: 16, fontFamily: 'Sora, sans-serif',
          }}>
            ✓ {success}
          </div>
        )}

        {/* ── CREATE / EDIT FORM ── */}
        {showForm && (
          <div style={{
            background: '#fff', borderRadius: 14, border: '1.5px solid #e2e8f0',
            padding: '20px 24px', marginBottom: 24,
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16, fontFamily: 'Sora, sans-serif' }}>
              {editingId ? 'Edit Post' : 'Create New Post'}
            </div>

            {error && (
              <div style={{ padding: '8px 12px', background: '#fef2f2', borderRadius: 7, fontSize: 12, color: '#dc2626', marginBottom: 12 }}>
                {error}
              </div>
            )}

            {/* Title */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4, fontFamily: 'Sora, sans-serif' }}>
                TITLE *
              </label>
              <input
                value={form.title}
                onChange={e => handleField('title', e.target.value)}
                placeholder="e.g. React is now required by Zoho — start learning now"
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 8,
                  border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: 'Sora, sans-serif',
                  outline: 'none', boxSizing: 'border-box', color: '#0f172a',
                }}
              />
            </div>

            {/* Body */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4, fontFamily: 'Sora, sans-serif' }}>
                BODY *
              </label>
              <textarea
                value={form.body}
                onChange={e => handleField('body', e.target.value)}
                placeholder="Write detailed tips, context, or instructions for students..."
                rows={4}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 8,
                  border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: 'Sora, sans-serif',
                  outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                  color: '#0f172a', lineHeight: 1.6,
                }}
              />
            </div>

            {/* Type + Priority row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4, fontFamily: 'Sora, sans-serif' }}>
                  POST TYPE
                </label>
                <select
                  value={form.post_type}
                  onChange={e => handleField('post_type', e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 8,
                    border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: 'Sora, sans-serif',
                    background: '#fff', cursor: 'pointer', color: '#0f172a',
                  }}
                >
                  {TYPE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4, fontFamily: 'Sora, sans-serif' }}>
                  PRIORITY
                </label>
                <select
                  value={form.priority}
                  onChange={e => handleField('priority', e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 8,
                    border: `1.5px solid ${PRIORITY_COLOR[form.priority]}40`,
                    fontSize: 13, fontFamily: 'Sora, sans-serif',
                    background: '#fff', cursor: 'pointer',
                    color: PRIORITY_COLOR[form.priority],
                    fontWeight: 600,
                  }}
                >
                  {PRIORITY_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Skill tag + Resource URL row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4, fontFamily: 'Sora, sans-serif' }}>
                  SKILL TAG (optional)
                </label>
                <input
                  value={form.skill_tag}
                  onChange={e => handleField('skill_tag', e.target.value)}
                  placeholder="e.g. React, AWS, SQL"
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 8,
                    border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: 'Sora, sans-serif',
                    outline: 'none', boxSizing: 'border-box', color: '#0f172a',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4, fontFamily: 'Sora, sans-serif' }}>
                  RESOURCE URL (optional)
                </label>
                <input
                  value={form.resource_url}
                  onChange={e => handleField('resource_url', e.target.value)}
                  placeholder="https://coursera.org/..."
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 8,
                    border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: 'Sora, sans-serif',
                    outline: 'none', boxSizing: 'border-box', color: '#0f172a',
                  }}
                />
              </div>
            </div>

            {/* Pin toggle */}
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              fontSize: 13, color: '#475569', fontFamily: 'Sora, sans-serif', marginBottom: 16,
            }}>
              <input
                type="checkbox"
                checked={form.is_pinned}
                onChange={e => handleField('is_pinned', e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              📌 Pin this post to the top of students' feed
            </label>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: '10px 24px', background: submitting ? '#94a3b8' : '#0f172a',
                  color: '#fff', border: 'none', borderRadius: 8, cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: 13, fontWeight: 700, fontFamily: 'Sora, sans-serif',
                }}
              >
                {submitting ? 'Saving...' : editingId ? 'Update Post' : 'Publish Post'}
              </button>
              <button
                onClick={closeForm}
                style={{
                  padding: '10px 20px', background: '#f1f5f9', color: '#475569',
                  border: 'none', borderRadius: 8, cursor: 'pointer',
                  fontSize: 13, fontFamily: 'Sora, sans-serif',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── ACTIVE POSTS ── */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 12, fontFamily: 'Sora, sans-serif' }}>
            ACTIVE POSTS ({activePosts.length})
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading...</div>
          )}

          {!loading && activePosts.length === 0 && (
            <div className="card" style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>📝</div>
              <div style={{ fontSize: 14, color: 'var(--text-2)' }}>No posts yet. Create your first skill news post.</div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activePosts.map(post => (
              <div
                key={post.id}
                style={{
                  background: '#fff', borderRadius: 12,
                  border: `1.5px solid ${post.priority === 'urgent' ? '#fecaca' : '#e2e8f0'}`,
                  overflow: 'hidden',
                }}
              >
                {/* Priority bar */}
                <div style={{ height: 3, background: PRIORITY_COLOR[post.priority] }} />

                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        {post.is_pinned && <span style={{ fontSize: 12 }}>📌</span>}
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', fontFamily: 'Sora, sans-serif' }}>
                          {post.title}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                          background: '#f1f5f9', color: '#475569',
                        }}>{TYPE_LABEL[post.post_type]}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                          color: PRIORITY_COLOR[post.priority],
                          background: PRIORITY_COLOR[post.priority] + '18',
                        }}>● {post.priority}</span>
                        {post.skill_tag && (
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                            background: '#f5f3ff', color: '#7c3aed',
                          }}># {post.skill_tag}</span>
                        )}
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>{timeAgo(post.created_at)}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, fontFamily: 'Sora, sans-serif' }}>
                        {post.body.length > 100 ? post.body.slice(0, 100) + '…' : post.body}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => handlePin(post.id)}
                        title={post.is_pinned ? 'Unpin' : 'Pin to top'}
                        style={{
                          width: 30, height: 30, borderRadius: 7,
                          border: `1.5px solid ${post.is_pinned ? '#0f172a' : '#e2e8f0'}`,
                          background: post.is_pinned ? '#0f172a' : '#fff',
                          cursor: 'pointer', fontSize: 13,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >📌</button>
                      <button
                        onClick={() => openEdit(post)}
                        style={{
                          width: 30, height: 30, borderRadius: 7,
                          border: '1.5px solid #e2e8f0', background: '#fff',
                          cursor: 'pointer', fontSize: 13,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >✏️</button>
                      <button
                        onClick={() => setDeleteConfirm(post.id)}
                        style={{
                          width: 30, height: 30, borderRadius: 7,
                          border: '1.5px solid #fecaca', background: '#fef2f2',
                          cursor: 'pointer', fontSize: 13,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >🗑</button>
                    </div>
                  </div>

                  {/* Delete confirm inline */}
                  {deleteConfirm === post.id && (
                    <div style={{
                      marginTop: 10, padding: '10px 12px', background: '#fef2f2',
                      borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <span style={{ fontSize: 12, color: '#dc2626', flex: 1, fontFamily: 'Sora, sans-serif' }}>
                        Hide this post from students?
                      </span>
                      <button
                        onClick={() => handleDelete(post.id)}
                        style={{
                          padding: '5px 12px', background: '#dc2626', color: '#fff',
                          border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        }}
                      >Hide</button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        style={{
                          padding: '5px 12px', background: '#f1f5f9', color: '#475569',
                          border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12,
                        }}
                      >Cancel</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── HIDDEN POSTS ── */}
        {inactivePosts.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 10, fontFamily: 'Sora, sans-serif' }}>
              HIDDEN POSTS ({inactivePosts.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {inactivePosts.map(post => (
                <div key={post.id} style={{
                  background: '#f8fafc', borderRadius: 10,
                  border: '1px solid #e2e8f0', padding: '12px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.6,
                }}>
                  <div style={{ fontSize: 13, color: '#64748b', fontFamily: 'Sora, sans-serif' }}>
                    {post.title}
                    <span style={{ marginLeft: 8, fontSize: 10, color: '#94a3b8' }}>{timeAgo(post.created_at)}</span>
                  </div>
                  <button
                    onClick={() => handleRestore(post.id)}
                    style={{
                      padding: '5px 12px', background: '#f1f5f9', color: '#475569',
                      border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer',
                      fontSize: 11, fontFamily: 'Sora, sans-serif',
                    }}
                  >Restore</button>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}