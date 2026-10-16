'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { ConsentVerifyResult } from '@/lib/account/consent-verify'

export default function ConsentContent({ token, action, initial }: { token: string | null; action: string | null; initial: ConsentVerifyResult }) {

  // Verified on the server before the first paint: no flash, and a used link renders "already used" immediately.
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'deleted'>(initial.ok ? 'success' : 'error')
  const [message, setMessage] = useState(initial.ok ? '' : (initial as any).error)
  const [password, setPassword] = useState('')
  const [step, setStep] = useState<'confirm' | 'password' | 'done'>('confirm')
  const [payload, setPayload] = useState<{ childEmail: string; parentEmail: string; childBirthYear: number; existingAccount?: boolean } | null>(initial.ok ? (initial as any).data : null)
  const [loading, setLoading] = useState(false)
  const [centerFull, setCenterFull] = useState(false)
  const [used, setUsed] = useState(!initial.ok && !!(initial as any).used)

  // Re-check when the page is restored from the back/forward cache or the tab regains focus,
  // so a stale form can never offer Approve on a link that was used meanwhile.
  useEffect(() => {
    if (!token) return
    const recheck = () => {
      fetch(`/api/auth/parental-consent/verify?token=${encodeURIComponent(token)}`, { cache: 'no-store' })
        .then(r => r.json())
        .then(data => { if (data.error && data.used) { setUsed(true); setMessage(data.error); setStatus('error') } })
        .catch(() => {})
    }
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) recheck() }
    const onVis = () => { if (document.visibilityState === 'visible') recheck() }
    window.addEventListener('pageshow', onShow)
    document.addEventListener('visibilitychange', onVis)
    return () => { window.removeEventListener('pageshow', onShow); document.removeEventListener('visibilitychange', onVis) }
  }, [token])

  async function handleApprove() {
    if (!token || !password || !payload) return
    setLoading(true)
    const res = await fetch('/api/auth/parental-consent/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    const data = await res.json()
    if (res.ok) { setCenterFull(!!data.centerFull); setStep('done') }
    else if (data.used) { setUsed(true); setMessage(data.error); setStatus('error') }
    else { setMessage(data.error || 'Failed to create account.'); setLoading(false) }
  }

  async function handleApproveExisting() {
    if (!token) return
    setLoading(true)
    const res = await fetch('/api/auth/parental-consent/approve-existing', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) setStep('done')
    else if (data.used) { setUsed(true); setMessage(data.error); setStatus('error') }
    else { setMessage(data.error || 'Failed to approve the account.'); setLoading(false) }
  }

  // GET safety: loading this page (with or without action=delete) only verifies the token via a read-only GET.
  // Approve/Decline happen only on a button click (POST) and burn the link (single use).
  async function handleDelete() {
    if (!token) return
    setLoading(true)
    // POST burns the link so it can never approve later. No account data is changed.
    const res = await fetch('/api/auth/parental-consent/decline', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (res.ok) setStatus('deleted')
    else { setUsed(!!data.used); setMessage(data.error || 'Something went wrong. Please try again.'); setStatus('error') }
  }

  if (status === 'loading') return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <p style={{ color: 'var(--text-dim)' }}>Verifying consent link…</p>
    </div>
  )

  if (status === 'deleted') return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
      <h2 style={{ fontWeight: 700, fontSize: '1.4rem', marginBottom: '0.75rem' }}>Request declined</h2>
      <p style={{ color: 'var(--text-dim)' }}>{payload?.existingAccount
        ? 'The account stays paused and will be deleted automatically after 14 days without approval.'
        : 'No account has been created. The request has been dismissed.'}</p>
    </div>
  )

  if (status === 'error') return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
      <h2 style={{ fontWeight: 700, fontSize: '1.4rem', marginBottom: '0.75rem' }}>{used ? 'This link has already been used.' : 'Link expired or invalid'}</h2>
      {!used && <p style={{ color: 'var(--text-dim)', marginBottom: '1rem' }}>{message}</p>}
      <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{used ? 'Each consent link works only once. Nothing was changed.' : 'The link is only valid for 1 hour. Please ask your child to try signing up again.'}</p>
    </div>
  )

  if (step === 'done') return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
      <h2 style={{ fontWeight: 700, fontSize: '1.4rem', marginBottom: '0.75rem' }}>{payload?.existingAccount ? 'Account approved!' : 'Account created!'}</h2>
      <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem' }}>
        {payload?.existingAccount
          ? `${payload.childEmail} can sign in and keep learning. Thank you!`
          : `${payload?.childEmail} can now sign in. A confirmation email has been sent to them.`}
      </p>
      {centerFull && <p data-testid='center-full' style={{ margin: '0 auto 1.5rem', maxWidth: 420, padding: '0.75rem 1rem', borderRadius: 12, border: '1px solid rgba(251,191,36,.45)', background: 'rgba(251,191,36,.1)' }}>Your center&apos;s seats are full. Ask your teacher. The account was created as a regular free account.</p>}
      <Link href="/auth/login" style={{ background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.75rem 2rem', borderRadius: '10px', fontWeight: 700, textDecoration: 'none' }}>
        Go to sign in
      </Link>
    </div>
  )

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem' }}>
        {step === 'confirm' && (
          <>
            <h2 style={{ fontWeight: 700, fontSize: '1.3rem', marginBottom: '1rem' }}>Parental Consent</h2>
            <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: '1rem' }}>
              {payload?.existingAccount ? 'You are approving an existing, currently paused Algegram account for:' : 'You are approving an Algegram account for:'}
            </p>
            <div style={{ background: 'rgba(108,99,255,.08)', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem' }}>
              <p style={{ margin: 0 }}><strong>Child email:</strong> {payload?.childEmail}</p>
              <p style={{ margin: '0.5rem 0 0' }}><strong>Birth year:</strong> {payload?.childBirthYear}</p>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              By approving, you confirm you are the parent or legal guardian of this child and consent to them using Algegram.
              Math question history will not be stored until you explicitly enable it.
            </p>
            {message && step === 'confirm' && <p style={{ color: 'var(--red)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{message}</p>}
            {action === 'delete' ? (
              <button onClick={handleDelete}
                style={{ width: '100%', background: '#ef4444', color: '#fff', padding: '0.8rem', borderRadius: '10px', fontWeight: 700, border: 'none', cursor: 'pointer', marginBottom: '0.75rem' }}>
                Decline this request
              </button>
            ) : payload?.existingAccount ? (
              <button onClick={handleApproveExisting} disabled={loading}
                style={{ width: '100%', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.8rem', borderRadius: '10px', fontWeight: 700, border: 'none', cursor: 'pointer', marginBottom: '0.75rem' }}>
                {loading ? 'Approving…' : 'Approve this account →'}
              </button>
            ) : (
              <button onClick={() => setStep('password')}
                style={{ width: '100%', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.8rem', borderRadius: '10px', fontWeight: 700, border: 'none', cursor: 'pointer', marginBottom: '0.75rem' }}>
                Approve — set child's password →
              </button>
            )}
            <button onClick={handleDelete}
              style={{ width: '100%', background: 'none', border: '1px solid var(--border)', color: 'var(--text-dim)', padding: '0.7rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.875rem' }}>
              Decline
            </button>
          </>
        )}

        {step === 'password' && (
          <>
            <h2 style={{ fontWeight: 700, fontSize: '1.3rem', marginBottom: '1rem' }}>Set a password</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Set a password for <strong style={{ color: 'var(--text)' }}>{payload?.childEmail}</strong>
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.4rem' }}>Password (min. 8 characters)</label>
              <input type="password" minLength={8} value={password} onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,.04)', border: '1.5px solid var(--border)', borderRadius: '10px', color: 'var(--text)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {message && <p style={{ color: 'var(--red)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{message}</p>}
            <button onClick={handleApprove} disabled={loading || password.length < 8}
              style={{ width: '100%', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.8rem', borderRadius: '10px', fontWeight: 700, border: 'none', cursor: 'pointer', opacity: loading || password.length < 8 ? 0.6 : 1 }}>
              {loading ? 'Creating account…' : 'Create account →'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

