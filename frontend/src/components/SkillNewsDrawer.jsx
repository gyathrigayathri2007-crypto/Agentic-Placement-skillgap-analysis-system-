// frontend/src/components/SkillNewsDrawer.jsx
// Floating side drawer — slides in from the right on StudentDashboard.
// Triggered by a bell/news button. Students scroll through faculty posts.

import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'

// ── CONFIG ─────────────────────────────────────────────────────
const TYPE_CONFIG = {
  tip:            { label: 'Skill tip',       color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  trend:          { label: 'Trending',         color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  company_update: { label: 'Company update',   color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  alert:          { label: 'Alert',            color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
}

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', color: '#dc2626', bg: '#fef2f2', dot: '#dc2626' },
  high:   { label: 'High',   color: '#d97706', bg: '#fffbeb', dot: '#d97706' },
  medium: { label: 'Medium', color: '#2563eb', bg: '#eff6ff', dot: '#2563eb' },
  low:    { label: 'Low',    color: '#6b7280', bg: '#f9fafb', dot: '#9ca3af' },
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60)   return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// ── NEWS CARD ──────────────────────────────────────────────────
function NewsCard({ post }) {
  const [expanded, setExpanded] = useState(false)
  const type     = TYPE_CONFIG[post.post_type]     || TYPE_CONFIG.tip
  const priority = PRIORITY_CONFIG[post.priority]  || PRIORITY_CONFIG.medium
  const isUrgent = post.priority === 'urgent'

  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      border: `1.5px solid ${isUrgent ? '#fecaca' : '#e2e8f0'}`,
      overflow: 'hidden',
      transition: 'box-shadow 0.15s',
      boxShadow: isUrgent ? '0 0 0 3px #fef2f2' : 'none',
    }}>
      {/* Priority accent bar */}
      <div style={{ height: 3, background: priority.dot }} />

      <div style={{ padding: '12px 14px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
          {post.is_pinned && (
            <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1 }}>📌</span>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: '#0f172a',
              lineHeight: 1.35, marginBottom: 4,
              fontFamily: 'Sora, sans-serif',
            }}>
              {post.title}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {/* Type badge */}
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                color: type.color, background: type.bg, border: `1px solid ${type.border}`,
              }}>{type.label}</span>

              {/* Priority badge */}
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                color: priority.color, background: priority.bg,
              }}>● {priority.label}</span>

              {/* Skill tag */}
              {post.skill_tag && (
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                  color: '#7c3aed', background: '#f5f3ff',
                }}># {post.skill_tag}</span>
              )}
            </div>
          </div>
        </div>

        {/* Body — collapsible if long */}
        <div
          style={{
            fontSize: 12, color: '#475569', lineHeight: 1.65,
            fontFamily: 'Sora, sans-serif',
            maxHeight: expanded ? 'none' : '4.5em',
            overflow: 'hidden',
            WebkitMaskImage: expanded ? 'none' : 'linear-gradient(to bottom, black 50%, transparent 100%)',
          }}
        >
          {post.body}
        </div>

        {post.body.length > 140 && (
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              fontSize: 11, color: '#2563eb', background: 'none', border: 'none',
              cursor: 'pointer', padding: '2px 0', fontWeight: 600,
              fontFamily: 'Sora, sans-serif',
            }}
          >
            {expanded ? '↑ Show less' : '↓ Read more'}
          </button>
        )}

        {/* Resource link */}
        {post.resource_url && (
          <a
            href={post.resource_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 6, marginTop: 8,
              padding: '7px 10px', background: '#f8fafc', borderRadius: 7,
              border: '1px solid #e2e8f0', textDecoration: 'none',
              fontSize: 11, color: '#2563eb', fontWeight: 600,
              fontFamily: 'Sora, sans-serif',
            }}
          >
            🔗 Open resource →
          </a>
        )}

        {/* Footer */}
        <div style={{ marginTop: 8, fontSize: 10, color: '#94a3b8', fontFamily: 'Sora, sans-serif' }}>
          {timeAgo(post.created_at)} · Posted by faculty
        </div>
      </div>
    </div>
  )
}

// ── MAIN DRAWER ────────────────────────────────────────────────
export default function SkillNewsDrawer({ isOpen, onClose }) {
  const [posts,      setPosts]      = useState([])
  const [loading,    setLoading]    = useState(false)
  const [filter,     setFilter]     = useState('all')   // 'all' | type value
  const [urgentCount, setUrgentCount] = useState(0)
  const drawerRef = useRef(null)

  // ── Fetch posts when drawer opens ────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    api.get('/news')
      .then(res => {
        setPosts(res.data.posts || [])
        setUrgentCount(res.data.unread_urgent || 0)
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [isOpen])

  // ── Close on Escape key ───────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // ── Filter posts ──────────────────────────────────────────────
  const filteredPosts = filter === 'all'
    ? posts
    : posts.filter(p => p.post_type === filter || p.priority === filter)

  const filterTabs = [
    { id: 'all',            label: 'All' },
    { id: 'alert',          label: '🚨 Alerts' },
    { id: 'urgent',         label: '⚡ Urgent' },
    { id: 'trend',          label: '📈 Trends' },
    { id: 'company_update', label: '🏢 Companies' },
    { id: 'tip',            label: '💡 Tips' },
  ]

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 998,
          background: 'rgba(0,0,0,0.25)',
        }}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 360, zIndex: 999,
          background: '#f8fafc',
          borderLeft: '1.5px solid #e2e8f0',
          display: 'flex', flexDirection: 'column',
          fontFamily: 'Sora, sans-serif',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
          animation: 'slideInRight 0.22s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
        `}</style>

        {/* Header */}
        <div style={{
          padding: '16px 18px 12px',
          background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                Skill News
                {urgentCount > 0 && (
                  <span style={{
                    marginLeft: 8, fontSize: 10, fontWeight: 700,
                    padding: '2px 7px', borderRadius: 20,
                    color: '#dc2626', background: '#fef2f2',
                  }}>
                    {urgentCount} urgent
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                Updates from your placement faculty
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 30, height: 30, borderRadius: 8,
                border: 'none', background: '#f1f5f9',
                cursor: 'pointer', fontSize: 16, color: '#64748b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >✕</button>
          </div>

          {/* Filter chips */}
          <div style={{
            display: 'flex', gap: 6, flexWrap: 'nowrap',
            overflowX: 'auto', paddingBottom: 2,
          }}>
            {filterTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                style={{
                  flexShrink: 0, padding: '5px 10px', borderRadius: 20,
                  border: `1.5px solid ${filter === tab.id ? '#0f172a' : '#e2e8f0'}`,
                  background: filter === tab.id ? '#0f172a' : '#fff',
                  color: filter === tab.id ? '#fff' : '#64748b',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'Sora, sans-serif',
                  transition: 'all 0.12s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '14px',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>
              Loading...
            </div>
          )}

          {!loading && filteredPosts.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>📭</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>
                {filter === 'all' ? 'No posts yet from faculty' : 'No posts in this category'}
              </div>
            </div>
          )}

          {!loading && filteredPosts.map(post => (
            <NewsCard key={post.id} post={post} />
          ))}
        </div>

        {/* Footer count */}
        {!loading && filteredPosts.length > 0 && (
          <div style={{
            padding: '10px 18px', background: '#fff',
            borderTop: '1px solid #e2e8f0',
            fontSize: 11, color: '#94a3b8', textAlign: 'center', flexShrink: 0,
          }}>
            {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
            {filter !== 'all' && ` · ${filter} filter active`}
          </div>
        )}
      </div>
    </>
  )
}