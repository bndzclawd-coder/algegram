'use client'
import { useCenterLink } from '@/lib/center/useCenterLink'
import { PRO_CTA_TEXT, PRO_PRICE_TEXT, PRO_OFFER_TEXT } from '@/lib/site-config'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

const CONSENT_SEND_ERROR = 'Something went wrong sending the email to your grown-up. Please try again.'

function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const centerLink = useCenterLink()
  const [cooldown, setCooldown] = useState(0)
  const [done, setDone] = useState(false)
  const [parentalConsentSent, setParentalConsentSent] = useState(false)
  const [resendSent, setResendSent] = useState(false)
  const router = useRouter()
  const params = useSearchParams()
  const plan = params.get('plan')

  const [supabase] = useState(() => typeof window === 'undefined' ? null : createClient())

  const currentYear = new Date().getFullYear()
  const age = birthYear ? currentYear - parseInt(birthYear, 10) - 1 : null // youngest possible age, matches server
  // Parental-consent age for the visitor's country (13 to 16), from the server. Default 13.
  const [consentAge, setConsentAge] = useState(13)
  useEffect(() => { fetch('/api/auth/consent-age', { cache: 'no-store' }).then(r => r.json()).then(d => { if (d?.age >= 13 && d?.age <= 16) setConsentAge(d.age) }).catch(() => {}) }, [])
  const isUnder13 = age !== null && age < consentAge // "needs a parent" (name kept for the existing flow)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!supabase) { setLoading(false); return }

    const yearNum = parseInt(birthYear, 10)
    if (!birthYear || isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
      setError('Please enter a valid birth year.')
      setLoading(false)
      return
    }

    // Under-13: parental consent flow
    if (isUnder13) {
      if (!parentEmail) {
        setError('Grown-up: please enter your email so we can ask for your permission.')
        setLoading(false)
        return
      }
      // Never leave the button spinning: give up after 20s and show a friendly error.
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 20_000)
      try {
        const res = await fetch('/api/auth/parental-consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ childEmail: email, childBirthYear: yearNum, parentEmail }),
          signal: ctrl.signal,
        })
        const d = await res.json().catch(() => ({}))
        if (!res.ok || !d?.ok) {
          setError(d?.error || CONSENT_SEND_ERROR)
        } else {
          setParentalConsentSent(true)
        }
      } catch {
        setError(CONSENT_SEND_ERROR)
      } finally {
        clearTimeout(timer)
        setLoading(false)
      }
      return
    }

    // 13+: server-side signup (age is re-checked on the server)
    // Never leave the button spinning: client timeout + always reset in finally.
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 20_000)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, birthYear: yearNum, plan: plan === 'pro' ? 'pro' : undefined }),
        signal: ctrl.signal,
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (d.consentRequired && d.consentAge) { setConsentAge(d.consentAge); setError("A parent or guardian needs to approve this account. Please add a grown-up's email below."); return }
        const msg: string = d.error || 'Sign-up failed. Please try again.'
        const m = msg.match(/(\d+)\s*seconds?/i)
        if (m) startCooldown(parseInt(m[1], 10))
        else setError(msg)
      } else {
        setDone(true)
      }
    } catch {
      setError('That took too long. Please check your connection and try again.')
    } finally {
      clearTimeout(timer)
      setLoading(false)
    }
  }

  function startCooldown(secs: number) {
    const until = Date.now() + Math.min(Math.max(secs, 1), 600) * 1000
    const tick = () => {
      const left = Math.ceil((until - Date.now()) / 1000)
      if (left <= 0) { setCooldown(0); setError(''); return }
      setCooldown(left)
      setError(`Too many attempts. Please wait ${left} second${left === 1 ? '' : 's'} and try again.`)
      setTimeout(tick, 1000)
    }
    tick()
  }

  async function handleResend() {
    if (!supabase || !email) return
    await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${location.origin}/auth/confirm?next=${plan === 'pro' ? '/upgrade' : '/chat'}` } })
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
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, marginTop: '0.75rem' }}>
          {centerLink.center
            ? `Pro through ${centerLink.center} starts after a parent approves.`
            : 'Once they approve, you get 7 days of Pro free. No card needed.'}
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
        {plan === 'pro' && !centerLink.center && (
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
            {plan === 'pro' && !centerLink.center ? `${PRO_CTA_TEXT}: create your account` : 'Create your free account'}
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            {centerLink.center ? `Create your account to get Pro through ${centerLink.center}.`
              : plan === 'pro'
              ? `Create your account, then upgrade to Pro (${PRO_PRICE_TEXT}${PRO_OFFER_TEXT ? `, ${PRO_OFFER_TEXT}` : ''}). Cancel anytime.`
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
                  {`Kids under ${consentAge} need a grown-up's permission.`} Grown-up: enter your email so we can ask for your permission. We'll send you one email with a link to approve or decline.
                </p>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.4rem' }}>Grown-up's email (parent or guardian)</label>
                <input type="email" required={isUnder13} value={parentEmail} onChange={e => setParentEmail(e.target.value)}
                  style={inputStyle} placeholder="parent@example.com" />
              </div>
            )}

            {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{error}</p>}

            <button type="submit" disabled={loading || cooldown > 0}
              style={{ background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.8rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem', border: 'none', cursor: 'pointer', opacity: loading || cooldown > 0 ? 0.7 : 1 }}>
              {loading ? 'Please wait…' : cooldown > 0 ? `Try again in ${cooldown}s` : isUnder13 ? 'Send parent consent email →' : plan === 'pro' ? 'Create account →' : 'Get started free →'}
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
