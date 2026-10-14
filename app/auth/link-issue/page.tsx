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
          {/* We can't tell (without revealing whether an email exists) if the account is confirmed,
              so lead with sign-in and keep resend secondary. */}
          <h1 style={{ fontWeight: 700, fontSize: '1.4rem', marginBottom: '0.75rem' }}>This link has already been used or expired</h1>
          <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
            If you already confirmed your email, just sign in. Otherwise, we can send you a new link.
          </p>
          <Link href={loginHref} style={btn}>Already confirmed? Sign in →</Link>
          <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Not confirmed yet? Resend the confirmation email.</p>
            {status === 'sent' ? <p style={{ color: 'var(--green)', fontSize: '0.85rem' }}>If that email needs confirming, a new link is on its way. Check your inbox.</p> : (
              <form onSubmit={resend} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                  style={{ padding: '0.65rem 1rem', background: 'rgba(255,255,255,.04)', border: '1.5px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }} />
                <button type="submit" disabled={status === 'sending'}
                  style={{ background: 'none', border: '1.5px solid var(--border)', color: 'var(--text)', padding: '0.65rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>
                  {status === 'sending' ? 'Sending…' : 'Resend confirmation email'}
                </button>
                {msg && <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{msg}</p>}
              </form>
            )}
          </div>
        </>) : (<>
          <h1 style={{ fontWeight: 700, fontSize: '1.4rem', marginBottom: '0.75rem' }}>Already confirmed? Please sign in</h1>
          <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: '1.25rem' }}>Your email may already be confirmed. Sign in to continue.</p>
          <Link href={loginHref} style={btn}>Sign in →</Link>
          <p style={{ marginTop: '1rem', fontSize: '0.85rem' }}>Not confirmed yet? <Link href={`/auth/link-issue?reason=expired&next=${encodeURIComponent(next)}`} style={{ color: 'var(--accent2)' }}>Resend the confirmation email</Link></p>
        </>)}
      </div>
    </div>
  )
}

export default function Page() {
  return <Suspense fallback={null}><LinkIssue /></Suspense>
}
