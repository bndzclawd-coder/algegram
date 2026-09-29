'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function ConsentContent() {
  const params = useSearchParams()
  const token = params.get('token')
  const action = params.get('action')

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'deleted'>('loading')
  const [message, setMessage] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState<'confirm' | 'password' | 'done'>('confirm')
  const [payload, setPayload] = useState<{ childEmail: string; parentEmail: string; childBirthYear: number } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Missing consent token.'); return }
    // Verify the token
    fetch(`/api/auth/parental-consent/verify?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setStatus('error'); setMessage(data.error) }
        else { setPayload(data); setStatus('success') }
      })
      .catch(() => { setStatus('error'); setMessage('Failed to verify token.') })
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
    if (res.ok) setStep('done')
    else { setMessage(data.error || 'Failed to create account.'); setLoading(false) }
  }

  async function handleDelete() {
    // Simply show a deleted message — no account was created
    setStatus('deleted')
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
      <p style={{ color: 'var(--text-dim)' }}>No account has been created. The request has been dismissed.</p>
    </div>
  )

  if (status === 'error') return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
      <h2 style={{ fontWeight: 700, fontSize: '1.4rem', marginBottom: '0.75rem' }}>Link expired or invalid</h2>
      <p style={{ color: 'var(--text-dim)', marginBottom: '1rem' }}>{message}</p>
      <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>The link is only valid for 1 hour. Please ask your child to try signing up again.</p>
    </div>
  )

  if (step === 'done') return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
      <h2 style={{ fontWeight: 700, fontSize: '1.4rem', marginBottom: '0.75rem' }}>Account created!</h2>
      <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem' }}>
        {payload?.childEmail} can now sign in. A confirmation email has been sent to them.
      </p>
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
              You are approving an Algegram account for:
            </p>
            <div style={{ background: 'rgba(108,99,255,.08)', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem' }}>
              <p style={{ margin: 0 }}><strong>Child email:</strong> {payload?.childEmail}</p>
              <p style={{ margin: '0.5rem 0 0' }}><strong>Birth year:</strong> {payload?.childBirthYear}</p>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              By approving, you confirm you are the parent or legal guardian of this child and consent to them using Algegram.
              Math question history will not be stored until you explicitly enable it.
            </p>
            {action === 'delete' ? (
              <button onClick={handleDelete}
                style={{ width: '100%', background: '#ef4444', color: '#fff', padding: '0.8rem', borderRadius: '10px', fontWeight: 700, border: 'none', cursor: 'pointer', marginBottom: '0.75rem' }}>
                Decline this request
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

export default function ConsentPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', padding: '3rem 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: '1.4rem', background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>
          Algegram
        </Link>
      </div>
      <Suspense fallback={<p style={{ textAlign: 'center', color: 'var(--text-dim)' }}>Loading…</p>}>
        <ConsentContent />
      </Suspense>
    </div>
  )
}
