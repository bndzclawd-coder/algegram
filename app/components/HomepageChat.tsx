'use client'
import { MathMarkdown } from '@/lib/chat/MathMarkdown'
import { memo, useState, useEffect, useRef, useCallback } from 'react'
import WatchLaylaButton from '@/app/components/whiteboard/WatchLaylaButton'

type Message = { role: 'user' | 'assistant'; content: string }

const EXAMPLE_QUESTIONS = [
  '3/4 + 1/6',
  'Solve: 2x² + 5x − 3 = 0',
  'What is a derivative?',
  '∫ x² sin(x) dx',
]

// Memoized: typing in the box re-renders the parent, but finished messages never re-parse or re-render.
const MessageBubble = memo(function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
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
        {isUser ? <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span> : <MathMarkdown text={msg.content} />}
      </div>
    </div>
  )
})

const MemoWatchLayla = memo(WatchLaylaButton)

function SignupWall({ onClose, proPitch = 'or go Pro for more.' }: { onClose: () => void; proPitch?: string }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid rgba(108,99,255,.4)', borderRadius: '24px', padding: '2rem', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 0 60px rgba(108,99,255,.2)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎉</div>
        <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', marginBottom: '0.5rem' }}>You’ve used your 5 free questions!</h2>
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: '0.75rem', fontSize: '0.9rem' }}>
          Sign up free to get <strong style={{ color: 'var(--text)' }}>7 days of Pro</strong>, then 20 questions a day on Free. No card needed.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
          <a href='/auth/signup' style={{ display: 'block', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.9rem', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }}>
            Sign up free, get 7 days of Pro →
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

/** intro: optional fixed line rendered by the page (not the model) above the first answer. */
export default function HomepageChat({ intro, placeholders, proPitch }: { intro?: string; placeholders?: string[]; proPitch?: string } = {}) {
  const [phIdx, setPhIdx] = useState(0)
  useEffect(() => {
    if (!placeholders?.length) return
    const id = setInterval(() => setPhIdx(i => (i + 1) % placeholders.length), 3000)
    return () => clearInterval(id)
  }, [placeholders])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [guestRemaining, setGuestRemaining] = useState(5)
  const [guestTotal] = useState(5)
  const [showSignupWall, setShowSignupWall] = useState(false)
  const acctRef = useRef<{ signedIn: boolean } | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const messagesBoxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/guest-limit')
      .then(r => r.json())
      .then(data => {
        setGuestRemaining(data.remaining ?? 5)
        if ((data.remaining ?? 5) <= 0) setShowSignupWall(true)
      })
      .catch(() => {})
  }, [])

  // Topic pages link to /?q=...#try so the box arrives prefilled (never auto-sent).
  useEffect(() => {
    const pre = new URLSearchParams(window.location.search).get('q')
    if (pre) {
      setInput(pre.slice(0, 500))
      inputRef.current?.focus()
    }
  }, [])

  useEffect(() => {
    if (messages.length === 0) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text || streaming) return
    if (!acctRef.current?.signedIn && guestRemaining <= 0) { setShowSignupWall(true); return }
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    await run(newMessages)
  }, [input, streaming, messages, guestRemaining])

  const run = useCallback(async (newMessages: Message[]) => {
    setStreaming(true)
    let res: Response
    try {
      res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, mode: 'math', surface: 'home' }),
      })
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: '⚠️ Something went wrong. Please try again.' }])
      setStreaming(false)
      return
    }
    // /api/chat checks and counts the guest limit itself and reports what's left.
    const left = res.headers.get('X-Guest-Remaining')
    if (left !== null) setGuestRemaining(Math.max(0, parseInt(left, 10) || 0))
    else if (res.ok) setAcct(a => (a && a.left !== null ? { ...a, left: Math.max(0, a.left - 1) } : a))
    if (!res.ok) {
      if (res.status === 429) setGuestRemaining(0)
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
  }, [])


  // ---- Photo help (Pro) ----
  const fileRef = useRef<HTMLInputElement>(null)
  const [photoGate, setPhotoGate] = useState<null | 'guest' | 'child'>(null)
  const [acct, setAcct] = useState<null | { signedIn: boolean; pro: boolean; child: boolean; left: number | null }>(null)
  useEffect(() => {
    fetch('/api/usage', { cache: 'no-store' }).then(async r => {
      if (r.status === 401) return setAcct({ signedIn: false, pro: false, child: false, left: null })
      const d = await r.json().catch(() => null)
      const pro = d?.plan === 'pro'
      setAcct({ signedIn: true, pro, child: !!d?.child, left: pro || typeof d?.limit !== 'number' ? null : Math.max(0, d.limit - (d.used ?? 0)) })
    }).catch(() => setAcct({ signedIn: false, pro: false, child: false, left: null }))
  }, [])
  acctRef.current = acct
  const onCamera = useCallback(() => {
    if (streaming) return
    if (!acct?.signedIn) return setPhotoGate('guest')
    if (!acct.pro) { if (acct.child) return setPhotoGate('child'); window.location.href = '/upgrade'; return }
    fileRef.current?.click()
  }, [acct, streaming])
  const sendPhoto = useCallback(async (file: File) => {
    // Re-encode in the browser (drops EXIF/GPS) and shrink to max 1600px before upload.
    let blob: Blob = file
    try {
      const bmp = await createImageBitmap(file)
      const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
      const c = document.createElement('canvas'); c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale)
      c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
      blob = await new Promise<Blob>((ok, no) => c.toBlob(b => (b ? ok(b) : no()), 'image/jpeg', 0.85))
    } catch {}
    const fd = new FormData(); fd.append('image', blob, 'photo.jpg')
    setMessages(m => [...m, { role: 'user', content: '📷 Photo of a math problem' }, { role: 'assistant', content: '' }])
    setStreaming(true)
    try {
      const res = await fetch('/api/photo', { method: 'POST', body: fd })
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: 'Something went wrong.' }))
        if (err.guest) setPhotoGate('guest'); else if (err.child) setPhotoGate('child'); else if (err.upgrade) window.location.href = '/upgrade'
        setMessages(m => { const c = [...m]; c[c.length - 1] = { role: 'assistant', content: `⚠️ ${err.error}` }; return c })
        return
      }
      const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = '', out = ''
      for (;;) {
        const { done, value } = await reader.read(); if (done) break
        buf += dec.decode(value, { stream: true }); const lines = buf.split('\n'); buf = lines.pop() || ''
        for (const line of lines) {
          if (!line.startsWith('data: ') || line.includes('[DONE]')) continue
          try { const d = JSON.parse(line.slice(6)).choices?.[0]?.delta?.content; if (d) { out += d; const o = out; setMessages(m => { const c = [...m]; c[c.length - 1] = { role: 'assistant', content: o }; return c }) } } catch {}
        }
      }
    } catch {
      setMessages(m => { const c = [...m]; c[c.length - 1] = { role: 'assistant', content: '⚠️ Something went wrong. Please try again.' }; return c })
    } finally { setStreaming(false); if (fileRef.current) fileRef.current.value = '' }
  }, [])

  const hasMessages = messages.length > 0
  const firstAssistant = messages.findIndex(x => x.role === 'assistant')

  return (
    <section id='try' aria-label='Try a free question' className='hero-section' style={{ maxWidth: 760, margin: '0 auto', padding: '1.5rem 1rem 1rem', scrollMarginTop: '5rem' }}>
      {photoGate && (
        <div role='dialog' aria-modal='true' style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setPhotoGate(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid rgba(108,99,255,.4)', borderRadius: '18px', padding: '1.5rem', maxWidth: 380, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
            {photoGate === 'guest' ? (<>
              <p style={{ fontWeight: 700, marginBottom: '0.4rem' }}>Photo help is part of Pro.</p>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '1rem' }}>Sign up free to try it for 7 days. No card needed.</p>
              <a href='/auth/signup' style={{ display: 'block', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.75rem', borderRadius: '10px', fontWeight: 700, textDecoration: 'none' }}>Sign up free →</a>
            </>) : (<>
              <p style={{ fontWeight: 700, marginBottom: '0.4rem' }}>Photo help is part of Pro.</p>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '1rem' }}>Ask a parent about Pro.</p>
              <a href='/chat?askparent=1' style={{ display: 'block', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.75rem', borderRadius: '10px', fontWeight: 700, textDecoration: 'none' }}>Ask a parent →</a>
            </>)}
            <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '0.75rem' }}>Snap just the problem, not your name.</p>
            <button onClick={() => setPhotoGate(null)} style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.75rem', cursor: 'pointer' }}>Not now</button>
          </div>
        </div>
      )}
      {showSignupWall && <SignupWall onClose={() => setShowSignupWall(false)} proPitch={proPitch} />}
      {!hasMessages && acct && !acct.signedIn && (
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-block', background: 'rgba(108,99,255,.12)', border: '1px solid rgba(108,99,255,.3)', borderRadius: '999px', padding: '0.3rem 1rem', fontSize: '0.8rem', color: 'var(--accent2)', marginBottom: '1.25rem' }}>
            ✨ No sign-up needed · {guestRemaining} free question{guestRemaining !== 1 ? 's' : ''} left
          </div>
        </div>
      )}
      {hasMessages && (
        <div ref={messagesBoxRef} style={{ marginBottom: '1rem', maxHeight: '55vh', overflowY: 'auto', paddingRight: '0.25rem' }}>
          {messages.map((m, i) => (
            <div key={i}>
              {intro && m.role === 'assistant' && i === firstAssistant && (
                <div data-testid='tutor-intro' style={{ fontWeight: 700, fontSize: '0.9rem', margin: '0 0 0.35rem 2.25rem' }}>{intro}</div>
              )}
              <MessageBubble msg={m} />
              {m.role === 'assistant' && i === messages.length - 1 && !streaming && m.content && !m.content.startsWith('⚠️') && <MemoWatchLayla answer={m.content} />}
            </div>
          ))}
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
          placeholder={placeholders?.length ? `Try: ${placeholders[phIdx]}` : 'Type any math problem… e.g. 3/4 + 1/6 or 2x + 5 = 17'} rows={3} aria-label='Type a math question'
          style={{ width: '100%', background: 'none', border: 'none', outline: 'none', resize: 'none', color: 'var(--text)', fontSize: '1rem', lineHeight: 1.65, fontFamily: 'inherit', display: 'block', boxSizing: 'border-box' }} />
        <div className='input-bottom-row' style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', gap: '0.5rem', flexWrap: 'wrap' }}>
          {acct?.signedIn ? (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', flexShrink: 1, minWidth: 0 }}>
            {acct.pro ? '' : acct.left !== null ? `${acct.left} question${acct.left !== 1 ? 's' : ''} left today` : ''}
          </span>
          ) : (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', flexShrink: 1, minWidth: 0, visibility: acct ? 'visible' : 'hidden' }}>
            {guestRemaining > 0 ? `${guestRemaining} free question${guestRemaining !== 1 ? 's' : ''} remaining · ` : 'Free limit reached · '}
            <a href='/auth/signup' style={{ color: 'var(--accent2)', textDecoration: 'none', fontWeight: 600 }}>Sign up for more →</a>
          </span>
          )}
          <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input ref={fileRef} type='file' accept='image/*' capture='environment' hidden onChange={e => { const f = e.target.files?.[0]; if (f) sendPhoto(f) }} />
          <button type='button' onClick={onCamera} aria-label='Solve from a photo (Pro)' title='Snap just the problem, not your name.'
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.55rem 0.8rem', cursor: 'pointer', fontSize: '1rem', color: 'var(--text)' }}>📷</button>
          <button onClick={() => send()} disabled={streaming || !input.trim()}
            style={{ background: streaming || !input.trim() ? 'rgba(108,99,255,.3)' : 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.6rem 1.4rem', cursor: streaming || !input.trim() ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0, minWidth: 80 }}>
            {streaming ? '…' : 'Solve →'}
          </button>
          </span>
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
      {!acct?.signedIn && guestRemaining < guestTotal && (
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
