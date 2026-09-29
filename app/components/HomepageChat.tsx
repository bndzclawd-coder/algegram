'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

type Message = { role: 'user' | 'assistant'; content: string }

const EXAMPLE_QUESTIONS = [
  '∫ x² sin(x) dx',
  'Solve: 2x² + 5x − 3 = 0',
  'What is a derivative?',
  'Graph y = sin(x)/x',
]

function useMathRenderer(dep: any) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const render = () => {
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
    const t = setTimeout(render, 200)
    return () => clearTimeout(t)
  }, [dep])
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  const parts: { type: 'text' | 'math-inline' | 'math-display'; content: string }[] = []
  const remaining = msg.content
  const allMatches: { idx: number; end: number; raw: string; display: boolean }[] = []
  let m
  const dRe = /\$\$([\s\S]*?)\$\$/g
  while ((m = dRe.exec(remaining)) !== null)
    allMatches.push({ idx: m.index, end: m.index + m[0].length, raw: m[1], display: true })
  const bracketRe = /\\\[([\s\S]*?)\\\]/g
  while ((m = bracketRe.exec(remaining)) !== null)
    allMatches.push({ idx: m.index, end: m.index + m[0].length, raw: m[1], display: true })
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
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '0.85rem' }}>
      {!isUser && (
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0, marginRight: '0.5rem', marginTop: '2px' }}>∫</div>
      )}
      <div style={{
        maxWidth: '82%', padding: '0.75rem 1rem',
        background: isUser ? 'rgba(108,99,255,.18)' : 'rgba(255,255,255,.04)',
        border: `1px solid ${isUser ? 'rgba(108,99,255,.35)' : 'rgba(255,255,255,.08)'}`,
        borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        fontSize: '0.9rem', lineHeight: 1.75,
        wordBreak: 'break-word', overflowWrap: 'break-word',
      }}>
        {parts.map((p, i) => {
          if (p.type === 'text') return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{p.content}</span>
          if (p.type === 'math-display') return (
            <div key={i} data-math-pending='1' data-raw={p.content} data-display='1'
              style={{ padding: '0.4rem 0', overflowX: 'auto', fontFamily: 'serif', color: 'var(--accent2)' }}>
              $${p.content}$$
            </div>
          )
          return (
            <span key={i} data-math-pending='1' data-raw={p.content}
              style={{ fontFamily: 'serif', color: 'var(--accent2)', padding: '0 2px' }}>
              ${p.content}$
            </span>
          )
        })}
      </div>
    </div>
  )
}

function SignupWall({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid rgba(108,99,255,.4)', borderRadius: '24px', padding: '2rem', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 0 60px rgba(108,99,255,.2)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎉</div>
        <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', marginBottom: '0.5rem' }}>You’ve used your 5 free questions!</h2>
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: '0.75rem', fontSize: '0.9rem' }}>
          Sign up free to get <strong style={{ color: 'var(--text)' }}>20 questions/day</strong>, or go Pro for unlimited math tutoring.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
          <a href='/auth/signup' style={{ display: 'block', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.9rem', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }}>
            Create free account →
          </a>
          <a href='/pricing' style={{ display: 'block', background: 'rgba(255,255,255,.06)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.75rem', borderRadius: '12px', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>
            See Pro plans
          </a>
          <a href='/auth/login' style={{ display: 'block', color: 'var(--text-dim)', fontSize: '0.8rem', textDecoration: 'none', marginTop: '0.25rem' }}>
            Already have an account? Sign in
          </a>
        </div>
        <button onClick={onClose} style={{ marginTop: '1.25rem', background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.75rem', cursor: 'pointer' }}>
          Maybe later
        </button>
      </div>
    </div>
  )
}

export default function HomepageChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [guestRemaining, setGuestRemaining] = useState(5)
  const [guestTotal] = useState(5)
  const [showSignupWall, setShowSignupWall] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const messagesBoxRef = useRef<HTMLDivElement>(null)

  useMathRenderer(messages)

  useEffect(() => {
    fetch('/api/guest-limit')
      .then(r => r.json())
      .then(data => {
        setGuestRemaining(data.remaining ?? 5)
        if ((data.remaining ?? 5) <= 0) setShowSignupWall(true)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text || streaming) return
    if (guestRemaining <= 0) { setShowSignupWall(true); return }
    const limitRes = await fetch('/api/guest-limit', { method: 'POST' })
    const limitData = await limitRes.json()
    if (!limitRes.ok || limitData.remaining < 0) { setShowSignupWall(true); return }
    setGuestRemaining(limitData.remaining)
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setStreaming(true)
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages, mode: 'math' }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Something went wrong' }))
      if (err.signup) { setShowSignupWall(true); setStreaming(false); return }
      setMessages(m => [...m, { role: 'assistant', content: `⚠️ ${err.error}` }])
      setStreaming(false)
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
            setMessages(m => { const copy = [...m]; copy[copy.length - 1] = { role: 'assistant', content: assistantMsg }; return copy })
          }
        } catch {}
      }
    }
    setStreaming(false)
  }, [input, streaming, messages, guestRemaining])

  const hasMessages = messages.length > 0

  return (
    <section id='chat' className='hero-section' style={{ maxWidth: 760, margin: '0 auto', padding: '2.5rem 1rem 2rem' }}>
      {showSignupWall && <SignupWall onClose={() => setShowSignupWall(false)} />}
      {!hasMessages && (
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-block', background: 'rgba(108,99,255,.12)', border: '1px solid rgba(108,99,255,.3)', borderRadius: '999px', padding: '0.3rem 1rem', fontSize: '0.8rem', color: 'var(--accent2)', marginBottom: '1.25rem' }}>
            ✨ No sign-up needed · {guestRemaining} free question{guestRemaining !== 1 ? 's' : ''} left
          </div>
        </div>
      )}
      {hasMessages && (
        <div ref={messagesBoxRef} style={{ marginBottom: '1rem', maxHeight: '55vh', overflowY: 'auto', paddingRight: '0.25rem' }}>
          {messages.map((m, i) => <MessageBubble key={i} msg={m} />)}
          {streaming && messages[messages.length - 1]?.role === 'assistant' && !messages[messages.length - 1]?.content && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', fontSize: '0.85rem', padding: '0 0 0.75rem 2.25rem' }}>
              <span style={{ display: 'inline-flex', gap: '3px' }}>{[0,1,2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: `bounce 1s ${i*0.2}s infinite` }} />)}</span>
              <span>Algegram is thinking…</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}
      <div style={{ background: 'var(--surface)', border: '2px solid rgba(108,99,255,.35)', borderRadius: '16px', padding: '0.9rem 1rem 0.75rem', boxShadow: '0 0 40px rgba(108,99,255,.1)' }}>
        <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder='Type any math problem… e.g. Solve x² + 5x + 6 = 0' rows={3}
          style={{ width: '100%', background: 'none', border: 'none', outline: 'none', resize: 'none', color: 'var(--text)', fontSize: '1rem', lineHeight: 1.65, fontFamily: 'inherit', display: 'block', boxSizing: 'border-box' }} />
        <div className='input-bottom-row' style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', flexShrink: 1, minWidth: 0 }}>
            {guestRemaining > 0 ? `${guestRemaining} free question${guestRemaining !== 1 ? 's' : ''} remaining · ` : 'Free limit reached · '}
            <a href='/auth/signup' style={{ color: 'var(--accent2)', textDecoration: 'none', fontWeight: 600 }}>Sign up for more →</a>
          </span>
          <button onClick={() => send()} disabled={streaming || !input.trim()}
            style={{ background: streaming || !input.trim() ? 'rgba(108,99,255,.3)' : 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.6rem 1.4rem', cursor: streaming || !input.trim() ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0, minWidth: 80 }}>
            {streaming ? '…' : 'Solve →'}
          </button>
        </div>
      </div>
      {!hasMessages && (
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginTop: '1rem', justifyContent: 'center' }}>
          {EXAMPLE_QUESTIONS.map(q => (
            <button key={q} onClick={() => { setInput(q); setTimeout(() => send(q), 0) }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '0.45rem 0.9rem', fontSize: '0.8rem', color: 'var(--text-dim)', cursor: 'pointer' }}>
              {q}
            </button>
          ))}
        </div>
      )}
      {guestRemaining < guestTotal && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ height: 3, background: 'var(--border)', borderRadius: 99 }}>
            <div style={{ height: '100%', width: `${Math.min(100, ((guestTotal - guestRemaining) / guestTotal) * 100)}%`, background: guestRemaining <= 0 ? '#ef4444' : 'var(--accent)', borderRadius: 99, transition: 'width .4s' }} />
          </div>
        </div>
      )}
      <style>{`
        @keyframes bounce { 0%, 100% { transform: translateY(0); opacity: .4; } 50% { transform: translateY(-4px); opacity: 1; } }
        textarea { scrollbar-width: thin; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
      `}</style>
    </section>
  )
}
