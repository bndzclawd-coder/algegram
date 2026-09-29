'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [parentalConsentSent, setParentalConsentSent] = useState(false)
  const [resendSent, setResendSent] = useState(false)
  const router = useRouter()
  const params = useSearchParams()
  const plan = params.get('plan')

  const [supabase] = useState(() => typeof window === 'undefined' ? null : createClient())

  const currentYear = new Date().getFullYear()
  const age = birthYear ? currentYear - parseInt(birthYear, 10) : null
  const isUnder13 = age !== null && age < 13

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!supabase) return

    const yearNum = parseInt(birthYear, 10)
    if (!birthYear || isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
      setError('Please enter a valid birth year.')
      setLoading(false)
      return
    }

    // Under-13: parental consent flow
    if (isUnder13) {
      if (!parentEmail) {
        setError('Please enter your parent or guardian\'s email.')
        setLoading(false)
        return
      }
      const res = await fetch('/api/auth/parental-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childEmail: email, childBirthYear: yearNum, parentEmail }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'Failed to send consent email.')
      } else {
        setParentalConsentSent(true)
      }
      setLoading(false)
      return
    }

    // 13+: normal signup
    const { error: signupErr } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback?next=/chat` },
    })

    if (signupErr) {
      setError(signupErr.message)
      setLoading(false)
    } else {
      setDone(true)
    }
  }

  async function handleResend() {
    if (!supabase || !email) return
    await supabase.auth.resend({ type: 'signup', email })
    setResendSent(true)
  }

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,.04)',
    border: '1.5px solid var(--border)', borderRadius: '10px', color: 'var(--text)',
    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const,
  }

  if (parentalConsentSent) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '420px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👪</div>
        <h2 style={{ fontWeight: 700, fontSize: '1.4rem', marginBottom: '0.75rem' }}>Check your parent's email</h2>
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.7 }}>
          We sent a consent link to <strong style={{ color: 'var(--text)' }}>{parentEmail}</strong>.<br />
          Your parent needs to approve your account before you can start.
        </p>
      </div>
    </div>
  )

  if (done) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📬</div>
        <h2 style={{ fontWeight: 700, fontSize: '1.4rem', marginBottom: '0.75rem' }}>Check your email</h2>
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.7 }}>
          We sent a confirmation link to <strong style={{ color: 'var(--text)' }}>{email}</strong>.
          Click it to activate your account.
        </p>
        {plan === 'pro' && (
          <p style={{ marginTop: '1rem', color: 'var(--accent2)', fontSize: '0.875rem' }}>
            After confirming, you'll be taken straight to Pro checkout.
          </p>
        )}
        {!resendSent ? (
          <button onClick={handleResend}
            style={{ marginTop: '1.5rem', background: 'none', border: '1px solid var(--border)', color: 'var(--text-dim)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
            Resend confirmation email
          </button>
        ) : (
          <p style={{ marginTop: '1rem', color: 'var(--green)', fontSize: '0.85rem' }}>Confirmation email resent!</p>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <Link href="/" style={{ display: 'block', textAlign: 'center', fontWeight: 800, fontSize: '1.4rem', background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '2rem', textDecoration: 'none' }}>
          Algegram
        </Link>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem' }}>
          <h1 style={{ fontWeight: 700, fontSize: '1.4rem', marginBottom: '0.4rem' }}>
            {plan === 'pro' ? 'Start your Pro trial' : 'Create your free account'}
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            {plan === 'pro'
              ? 'Start your 7-day free Pro trial — $12.99/month after, cancel anytime.'
              : '20 free messages per day. No credit card.'}
          </p>

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.4rem' }}>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                style={inputStyle} placeholder="you@example.com" />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.4rem' }}>Password</label>
              <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
                style={inputStyle} placeholder="Min. 8 characters" />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.4rem' }}>Birth year</label>
              <input type="number" required min={1900} max={currentYear} value={birthYear}
                onChange={e => setBirthYear(e.target.value)}
                style={inputStyle} placeholder={`e.g. ${currentYear - 16}`} />
            </div>

            {isUnder13 && (
              <div style={{ background: 'rgba(167,139,250,.08)', border: '1px solid rgba(167,139,250,.3)', borderRadius: '10px', padding: '1rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>
                  We need a parent or guardian's permission for users under 13. Enter their email and we'll send a consent link.
                </p>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.4rem' }}>Parent or guardian's email</label>
                <input type="email" required={isUnder13} value={parentEmail} onChange={e => setParentEmail(e.target.value)}
                  style={inputStyle} placeholder="parent@example.com" />
              </div>
            )}

            {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{error}</p>}

            <button type="submit" disabled={loading}
              style={{ background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.8rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem', border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Please wait…' : isUnder13 ? 'Send parent consent email →' : plan === 'pro' ? 'Create account →' : 'Get started free →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-dim)' }}>
            Already have an account? <Link href="/auth/login" style={{ color: 'var(--accent2)' }}>Sign in</Link>
          </p>
          <p style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            By signing up you agree to our{' '}
            <Link href="/terms" style={{ color: 'var(--accent2)' }}>Terms</Link>
            {' '}&amp;{' '}
            <Link href="/privacy" style={{ color: 'var(--accent2)' }}>Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Signup() {
  return <Suspense fallback={null}><SignupForm /></Suspense>
}
