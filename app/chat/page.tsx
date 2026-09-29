'use client'
import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type Message = { role: 'user' | 'assistant'; content: string }
type Mode = 'math' | 'graph' | 'explain' | 'check'
type Usage = { plan: string; used: number; limit: number | null; remaining: number | null }

const MODES: { id: Mode; label: string; icon: string; hint: string }[] = [
  { id: 'math', label: 'Solve', icon: '∫', hint: 'Solve any math problem step by step' },
  { id: 'graph', label: 'Graph', icon: '📈', hint: 'Analyze and describe functions' },
  { id: 'explain', label: 'Explain', icon: '💡', hint: 'Learn concepts clearly' },
  { id: 'check', label: 'Check', icon: '✓', hint: 'Verify your work' },
]

const PRO_MODELS = [
  { id: 'qwen/qwen3-14b', label: 'Qwen3-14B' },
  { id: 'openai/gpt-4o', label: 'GPT-4o' },
  { id: 'anthropic/claude-sonnet-4-5', label: 'Claude Sonnet' },
  { id: 'google/gemini-2.0-flash-001', label: 'Gemini Flash' },
  { id: 'deepseek/deepseek-r1', label: 'DeepSeek R1' },
]

// KaTeX renderer hook
function useMathRenderer() {
  useEffect(() => {
    const renderAll = async () => {
      if (typeof window === 'undefined') return
      // @ts-ignore
      if (!window.katex) return
      document.querySelectorAll('[data-math-pending]').forEach((el) => {
        el.removeAttribute('data-math-pending')
        const raw = el.getAttribute('data-raw') || ''
        const displayMode = el.getAttribute('data-display') === '1'
        try {
          // @ts-ignore
          el.innerHTML = window.katex.renderToString(raw, { displayMode, throwOnError: false })
        } catch {}
      })
    }
    const timer = setInterval(renderAll, 300)
    return () => clearInterval(timer)
  }, [])
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  const parts: { type: 'text' | 'math-inline' | 'math-display'; content: string }[] = []
  let remaining = msg.content
  const allMatches: { idx: number; end: number; raw: string; display: boolean }[] = []
  let m
  const dRe = /\$\$([\s\S]*?)\$\$/g
  while ((m = dRe.exec(remaining)) !== null) {
    allMatches.push({ idx: m.index, end: m.index + m[0].length, raw: m[1], display: true })
  }
  const iRe = /\$(?!\$)((?:[^$\\]|\\.)*?)\$/g
  while ((m = iRe.exec(remaining)) !== null) {
    const overlap = allMatches.some(d => m!.index >= d.idx && m!.index < d.end)
    if (!overlap) allMatches.push({ idx: m.index, end: m.index + m[0].length, raw: m[1], display: false })
  }
  allMatches.sort((a, b) => a.idx - b.idx)
  let cursor = 0
  for (const match of allMatches) {
    if (match.idx > cursor) parts.push({ type: 'text', content: remaining.slice(cursor, match.idx) })
    parts.push({ type: match.display ? 'math-display' : 'math-inline', content: match.raw })
    cursor = match.end
  }
  if (cursor < remaining.length) parts.push({ type: 'text', content: remaining.slice(cursor) })

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '1rem' }}>
      {!isUser && (
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0, marginRight: '0.6rem', marginTop: '2px' }}>∫</div>
      )}
      <div style={{
        maxWidth: '78%', padding: '0.9rem 1.1rem',
        background: isUser ? 'rgba(108,99,255,.2)' : 'rgba(255,255,255,.04)',
        border: `1px solid ${isUser ? 'rgba(108,99,255,.4)' : 'rgba(255,255,255,.08)'}`,
        borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        fontSize: '0.9rem', lineHeight: 1.75,
      }}>
        {parts.map((p, i) => {
          if (p.type === 'text') return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{p.content}</span>
          if (p.type === 'math-display') return (
            <div key={i} data-math-pending="1" data-raw={p.content} data-display="1"
              style={{ padding: '0.5rem 0', overflowX: 'auto', fontFamily: 'serif', color: 'var(--accent2)' }}>
              $${p.content}$$
            </div>
          )
          return (
            <span key={i} data-math-pending="1" data-raw={p.content}
              style={{ fontFamily: 'serif', color: 'var(--accent2)', padding: '0 2px' }}>
              ${p.content}$
            </span>
          )
        })}
      </div>
    </div>
  )
}

function UpgradeWatcher({ onUpgraded }: { onUpgraded: () => void }) {
  const params = useSearchParams()
  useEffect(() => {
    if (params.get('upgraded') === '1') onUpgraded()
  }, [params, onUpgraded])
  return null
}


function SignupWall({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '2.5rem', maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎉</div>
        <h2 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: '0.5rem' }}>You've used your 5 free questions!</h2>
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: '1.75rem', fontSize: '0.9rem' }}>
          Sign up free to get <strong style={{ color: 'var(--text)' }}>20 questions/day</strong>, or go Pro for unlimited math tutoring.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <a href="/auth/signup" style={{ display: 'block', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.85rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none' }}>
            Create free account →
          </a>
          <a href="/auth/login" style={{ display: 'block', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.75rem', borderRadius: '12px', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>
            Sign in
          </a>
        </div>
        <button onClick={onClose} style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.8rem', cursor: 'pointer' }}>
          Maybe later
        </button>
      </div>
    </div>
  )
}

function ChatInner() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<Mode>('math')
  const [model, setModel] = useState('qwen/qwen3-14b')
  const [streaming, setStreaming] = useState(false)
  const [usage, setUsage] = useState<Usage | null>(null)
  const [user, setUser] = useState<any>(null)
  const [showSignupWall, setShowSignupWall] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const [supabase] = useState(() => typeof window === 'undefined' ? null : createClient())

  useMathRenderer()

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user)
        fetchUsage()
      }
    })
  }, [supabase])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchUsage() {
    try {
      const r = await fetch('/api/usage')
      if (r.ok) setUsage(await r.json())
    } catch {}
  }

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || streaming) return
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setStreaming(true)

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages: newMessages, model, mode }),
    })

    if (!res.ok) {
      const err = await res.json()
      if (err.signup) {
        setShowSignupWall(true)
        setStreaming(false)
        return
      }
      setMessages(m => [...m, { role: 'assistant', content: `⚠️ ${err.error}${err.upgrade ? '\n\n[Upgrade to Pro →](/pricing)' : ''}` }])
      setStreaming(false)
      fetchUsage()
      return
    }


    const reader = res.body!.getReader()
    const dec = new TextDecoder()
    let buf = ''
    let assistantMsg = ''
    setMessages(m => [...m, { role: 'assistant', content: '' }])
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() || ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (data === '[DONE]') continue
        try {
          const delta = JSON.parse(data).choices?.[0]?.delta?.content
          if (delta) {
            assistantMsg += delta
            setMessages(m => {
              const copy = [...m]
              copy[copy.length - 1] = { role: 'assistant', content: assistantMsg }
              return copy
            })
          }
        } catch {}
      }
    }
    setStreaming(false)
    fetchUsage()
  }, [input, streaming, messages, model, mode])

  async function upgradeToPro() {
    const res = await fetch('/api/stripe/checkout', { method: 'POST' })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut()
    router.push('/')
  }

  const isPro = usage?.plan === 'pro'
  const usagePercent = usage?.limit ? Math.min(100, ((usage.used / usage.limit) * 100)) : 0

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', overflow: 'hidden', position: 'relative' }}>
      {showSignupWall && <SignupWall onClose={() => setShowSignupWall(false)} />}
      <Suspense fallback={null}><UpgradeWatcher onUpgraded={fetchUsage} /></Suspense>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 40 }}
        />
      )}

      {/* Sidebar */}
      <aside className={`chat-sidebar${sidebarOpen ? ' open' : ''}`} style={{ width: 240, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontWeight: 800, fontSize: '1.1rem', background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>
            Algegram
          </Link>
          {/* Close button — only visible on mobile */}
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1, padding: '0.25rem' }}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Mode selector */}
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>Mode</div>
          {MODES.map(m => (
            <button key={m.id} onClick={() => { setMode(m.id); setSidebarOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', marginBottom: '2px', textAlign: 'left', fontSize: '0.875rem', fontWeight: mode === m.id ? 600 : 400, background: mode === m.id ? 'rgba(108,99,255,.2)' : 'transparent', color: mode === m.id ? 'var(--accent2)' : 'var(--text-dim)' }}>
              <span style={{ fontSize: '1rem' }}>{m.icon}</span> {m.label}
            </button>
          ))}
        </div>

        {/* Model selector (Pro only) */}
        {isPro && (
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>Model</div>
            <select value={model} onChange={e => setModel(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '0.8rem', padding: '0.45rem 0.6rem', outline: 'none', cursor: 'pointer' }}>
              {PRO_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Usage / upgrade */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
          {isPro ? (
            <div style={{ background: 'rgba(108,99,255,.1)', border: '1px solid rgba(108,99,255,.25)', borderRadius: '10px', padding: '0.75rem', textAlign: 'center', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent2)', fontWeight: 600 }}>⭐ Pro Plan</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>Unlimited messages</div>
            </div>
          ) : (
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
                <span>Daily messages</span>
                <span>{usage?.used ?? 0}/{usage?.limit ?? 20}</span>
              </div>
              <div style={{ height: 4, background: 'var(--border)', borderRadius: 99 }}>
                <div style={{ height: '100%', width: `${usagePercent}%`, background: usagePercent > 80 ? 'var(--red)' : 'var(--accent)', borderRadius: 99, transition: 'width .3s' }} />
              </div>
              {user && (
                <button onClick={upgradeToPro}
                  style={{ marginTop: '0.75rem', width: '100%', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.6rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                  Upgrade to Pro →
                </button>
              )}
            </div>
          )}
          {user ? (
            <>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              <button onClick={signOut} style={{ marginTop: '0.4rem', background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}>Sign out</button>
            </>
          ) : (
            <a href="/auth/signup" style={{ display: 'block', textAlign: 'center', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.55rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none' }}>
              Sign up free →
            </a>
          )}
        </div>
      </aside>

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top bar */}
        <div style={{ height: 52, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 1rem', justifyContent: 'space-between', flexShrink: 0 }}>
          {/* Hamburger button — visible on mobile */}
          <button
            className="sidebar-toggle-btn"
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '1.25rem', cursor: 'pointer', padding: '0.25rem 0.5rem 0.25rem 0', lineHeight: 1, flexShrink: 0 }}
            aria-label="Open menu"
          >
            ☰
          </button>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {MODES.find(m => m.id === mode)?.hint}
          </div>
          {isPro && <span style={{ fontSize: '0.75rem', background: 'rgba(108,99,255,.15)', border: '1px solid rgba(108,99,255,.3)', color: 'var(--accent2)', padding: '0.2rem 0.6rem', borderRadius: '999px', flexShrink: 0 }}>Pro</span>}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1rem 0.5rem' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', paddingTop: '4rem', color: 'var(--text-dim)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>∫</div>
              <h2 style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>What math problem can Algegram solve for you? 📐?</h2>
              <p style={{ fontSize: '0.875rem' }}>Try: "What is 2/3 + 3/4?" or "Explain fractions!" or "Help with my algebra homework 📚"</p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                {['∫ x² sin(x) dx', 'Solve: 2x² + 5x - 3 = 0', 'What is a derivative?', 'Graph y = sin(x)/x'].map(s => (
                  <button key={s} onClick={() => setInput(s)}
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '0.5rem 1rem', fontSize: '0.8rem', color: 'var(--text-dim)', cursor: 'pointer' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => <MessageBubble key={i} msg={m} />)}
          {streaming && messages[messages.length - 1]?.role === 'assistant' && !messages[messages.length - 1]?.content && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', fontSize: '0.85rem', padding: '0 0 1rem 2.5rem' }}>
              <span style={{ display: 'inline-flex', gap: '3px' }}>
                {[0,1,2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: `bounce 1s ${i*0.2}s infinite` }} />)}
              </span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: '14px', padding: '0.75rem 1rem' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Type any math problem… 📐 (Shift+Enter for new line)"
              rows={1}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', resize: 'none', color: 'var(--text)', fontSize: '0.925rem', lineHeight: 1.6, maxHeight: 160, overflowY: 'auto', fontFamily: 'inherit' }}
            />
            <button onClick={send} disabled={streaming || !input.trim()}
              style={{ background: streaming || !input.trim() ? 'rgba(108,99,255,.3)' : 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.55rem 1rem', cursor: streaming || !input.trim() ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
              {streaming ? '…' : '→'}
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
            AI can make mistakes. Verify important results.
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: .4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
        textarea { scrollbar-width: thin; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }

        /* Sidebar: hidden on mobile, visible on desktop */
        .chat-sidebar {
          position: static;
          z-index: auto;
        }
        .sidebar-toggle-btn {
          display: none;
        }
        .sidebar-close-btn {
          display: none;
        }
        .sidebar-backdrop {
          display: none;
        }

        @media (max-width: 768px) {
          .chat-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            z-index: 50;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
          }
          .chat-sidebar.open {
            transform: translateX(0);
          }
          .sidebar-toggle-btn {
            display: block;
          }
          .sidebar-close-btn {
            display: block;
          }
          .sidebar-backdrop {
            display: block;
          }
        }
      `}</style>
    </div>
  )
}

export default function Chat() {
  return <ChatInner />
}
