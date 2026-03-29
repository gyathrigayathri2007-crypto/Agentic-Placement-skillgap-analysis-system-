import { useState, useRef, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import api from '../api/axios'

const SendIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)

const SUGGESTIONS = [
  'How do I prepare for TCS NQT?',
  'What DSA topics should I focus on for Zoho?',
  'Explain how to improve my readiness score',
  'Give me a 4-week Python learning plan',
  'What projects can I build to impress Amazon?',
  'How to write a good resume for freshers?',
  'What is the difference between eligible and near-eligible?',
  'How important is CGPA for placements?',
]

function isQuotaError(text) {
  return text && (
    text.includes('429') ||
    text.includes('quota') ||
    text.includes('rate limit') ||
    text.toLowerCase().includes('temporarily busy') ||
    text.toLowerCase().includes('could not process')
  )
}

function isFallbackResponse(text) {
  return text && text.includes('_(Note: AI is temporarily unavailable')
}

export default function AiChat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hi! I'm your AI placement assistant 🤖\n\nI can help you with:\n• Interview preparation & DSA tips\n• Company-specific guidance (TCS, Zoho, Amazon…)\n• Skill roadmaps and learning plans\n• Resume tips and career advice\n\nWhat would you like to know?",
      suggestions: true,
    }
  ])
  const [input,     setInput]   = useState('')
  const [loading,   setLoading] = useState(false)
  const [retryWait, setRetry]   = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text) => {
    const msgText = (text || input).trim()
    if (!msgText || loading) return
    setInput('')
    setMessages(m => [...m, { role: 'user', text: msgText }])
    setLoading(true)
    setRetry(false)
    try {
      const res = await api.post('/ai/chat', { message: msgText })
      const responseText = res.data.response || ''
      const isFallback = isFallbackResponse(responseText)

      if (isQuotaError(responseText) && !isFallback) {
        setRetry(true)
        setMessages(m => [...m, {
          role: 'assistant',
          text: '⚠️ The AI is temporarily rate-limited (too many requests on the free tier). Please wait 30–60 seconds and try again.',
          isError: true,
        }])
      } else {
        setMessages(m => [...m, { role: 'assistant', text: responseText, isFallback }])
      }
    } catch (err) {
      const status = err.response?.status
      if (status === 429) {
        setRetry(true)
        setMessages(m => [...m, {
          role: 'assistant',
          text: '⚠️ Too many requests. Please wait a moment and try again.',
          isError: true,
        }])
      } else {
        setMessages(m => [...m, {
          role: 'assistant',
          text: '❌ Could not reach the AI server. Please make sure the backend is running.',
          isError: true,
        }])
      }
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="app-shell">
      <Sidebar role="student" />
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', padding: 0, height: '100vh' }}>

        {/* Header */}
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid var(--border)', background: '#fff',
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: 'var(--brand-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0
          }}>🤖</div>
          <div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>
              AI Placement Assistant
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>
              Powered by Google Gemini · Placement guidance only
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: retryWait ? '#f59e0b' : '#16a34a', animation: retryWait ? 'none' : 'pulse 2s infinite' }} />
            <span style={{ fontSize: 11, color: retryWait ? '#d97706' : '#16a34a', fontWeight: 600 }}>
              {retryWait ? 'Rate Limited' : 'Online'}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.map((m, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
                {m.role === 'assistant' && (
                  <div style={{
                    width: 28, height: 28, background: 'var(--brand-light)', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0
                  }}>🤖</div>
                )}
                <div style={{
                  maxWidth: '74%', padding: '11px 15px', borderRadius: 14, fontSize: 13.5, lineHeight: 1.7,
                  background: m.role === 'user' ? 'var(--brand)'
                    : m.isError ? '#fffbeb'
                    : m.isFallback ? '#fefce8'
                    : '#fff',
                  color: m.role === 'user' ? '#fff'
                    : m.isError ? '#92400e'
                    : m.isFallback ? '#713f12'
                    : 'var(--text-1)',
                  border: m.role === 'user' ? 'none'
                    : m.isError ? '1px solid #fde68a'
                    : m.isFallback ? '1px solid #fef08a'
                    : '1px solid var(--border)',
                  borderBottomRightRadius: m.role === 'user' ? 4 : 14,
                  borderBottomLeftRadius: m.role === 'assistant' ? 4 : 14,
                  whiteSpace: 'pre-wrap',
                  boxShadow: m.role !== 'user' ? '0 1px 4px rgba(0,0,0,0.05)' : 'none',
                }}>
                  {m.text}
                </div>
                {m.role === 'user' && (
                  <div style={{
                    width: 28, height: 28, background: 'var(--brand)', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0
                  }}>👤</div>
                )}
              </div>

              {/* Suggestion chips — shown only on the first assistant message */}
              {m.suggestions && (
                <div style={{ marginTop: 12, marginLeft: 36, display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {SUGGESTIONS.map((s, j) => (
                    <button
                      key={j}
                      onClick={() => send(s)}
                      disabled={loading}
                      style={{
                        padding: '6px 12px', fontSize: 12, borderRadius: 20,
                        border: '1px solid var(--border)', background: '#fafbfc',
                        color: 'var(--brand)', cursor: 'pointer', fontWeight: 500,
                        transition: 'all 0.15s',
                        fontFamily: 'DM Sans, sans-serif',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-light)'; e.currentTarget.style.borderColor = 'var(--brand)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#fafbfc'; e.currentTarget.style.borderColor = 'var(--border)' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Retry button if rate limited */}
              {m.isError && retryWait && (
                <div style={{ marginTop: 8, marginLeft: 36 }}>
                  <button
                    onClick={() => {
                      setRetry(false)
                      const lastUserMsg = [...messages].reverse().find(x => x.role === 'user')
                      if (lastUserMsg) send(lastUserMsg.text)
                    }}
                    style={{
                      fontSize: 12, color: 'var(--brand)', background: 'var(--brand-light)',
                      border: '1px solid var(--brand)', borderRadius: 8,
                      padding: '5px 14px', cursor: 'pointer', fontWeight: 500,
                    }}
                  >
                    🔄 Retry
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Loading dots */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <div style={{
                width: 28, height: 28, background: 'var(--brand-light)', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13
              }}>🤖</div>
              <div style={{
                padding: '12px 16px', background: '#fff', border: '1px solid var(--border)',
                borderRadius: 14, borderBottomLeftRadius: 4,
              }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)',
                      animation: `bounce 1s ease ${i * 0.2}s infinite`
                    }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Rate limit notice */}
        {retryWait && (
          <div style={{
            padding: '8px 24px', background: '#fffbeb', borderTop: '1px solid #fde68a',
            fontSize: 12, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8
          }}>
            ⏳ AI is temporarily rate-limited. Wait 30–60 seconds before sending another message.
          </div>
        )}

        {/* Input box */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', background: '#fff', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              className="sp-input"
              style={{ flex: 1, height: 44, resize: 'none', paddingTop: 11, fontFamily: 'DM Sans, sans-serif' }}
              placeholder="Ask about skills, interview tips, company preparation…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              style={{
                width: 44, height: 44, flexShrink: 0, background: 'var(--brand)',
                border: 'none', borderRadius: 10,
                cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                opacity: !input.trim() || loading ? 0.45 : 1, transition: 'opacity 0.15s',
              }}
            >
              <SendIcon />
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
            Enter to send · Shift+Enter for new line · Placement questions only
          </div>
        </div>

        <style>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50%       { transform: translateY(-5px); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.4; }
          }
        `}</style>
      </main>
    </div>
  )
}