'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

function safe(n: string | null) {
  return n && n.startsWith('/') && !n.startsWith('//') && !n.includes('\\') ? n : '/chat'
}

function LinkIssue() {
  const params = useSearchParams()
  const expired = params.get('reason') === 'expired'
  const next = safe(params.get('next'))
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [msg, setMsg] = useState('')
  const loginHref = `/auth/login?next=${encodeURIComponent(next)}`

  async function resend(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('sending'); setMsg('')
    try {
      const supabase = createClient()
      const timeout = new Promise<{ error: Error }>(r => setTimeout(() => r({ error: new Error('Taking too long. Please try again.') }), 20_000))
      const { error } = await Promise.race([
        supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${location.origin}/auth/confirm?next=${encodeURIComponent(next)}` } }),
        timeout,
      ])
      if (error) { setStatus('error'); setMsg(error.message) } else setStatus('sent')
    } catch { setStatus('error'); setMsg('Something went wrong. Please try again.') }
  }

  const box = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem', maxWidth: '420px', width: '100%', textAlign: 'center' as const }
  const btn = { display: 'inline-block', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.8rem 1.4rem', borderRadius: '10px', fontWeight: 700, border: 'none', cursor: 'pointer', textDecoration: 'none' }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={box}>
        {expired ? (<>
          <h1 style={{ fontWeight: 700, fontSize: '1.4rem', marginBottom: '0.75rem' }}>Link expired</h1>
          <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
            This confirmation link has expired or was replaced by a newer one. Enter your email and we&apos;ll send a fresh link.
          </p>
          {status === 'sent' ? <p style={{ color: 'var(--green)' }}>New link sent. Check your inbox.</p> : (
            <form onSubmit={resend} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,.04)', border: '1.5px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }} />
              <button type="submit" disabled={status === 'sending'} style={btn}>{status === 'sending' ? 'Sending…' : 'Resend confirmation email'}</button>
              {msg && <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{msg}</p>}
            </form>
          )}
          <p style={{ marginTop: '1rem', fontSize: '0.85rem' }}>Already confirmed? <Link href={loginHref} style={{ color: 'var(--accent2)' }}>Sign in</Link></p>
        </>) : (<>
          <h1 style={{ fontWeight: 700, fontSize: '1.4rem', marginBottom: '0.75rem' }}>Your email may already be confirmed</h1>
          <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: '1.25rem' }}>Please sign in to continue.</p>
          <Link href={loginHref} style={btn}>Sign in →</Link>
          <p style={{ marginTop: '1rem', fontSize: '0.85rem' }}>Link not working? <Link href={`/auth/link-issue?reason=expired&next=${encodeURIComponent(next)}`} style={{ color: 'var(--accent2)' }}>Send a new one</Link></p>
        </>)}
      </div>
    </div>
  )
}

export default function Page() {
  return <Suspense fallback={null}><LinkIssue /></Suspense>
}
