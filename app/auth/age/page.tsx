'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const box: React.CSSProperties = { width: '100%', maxWidth: '400px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }
const input: React.CSSProperties = { padding: '0.75rem 1rem', background: 'rgba(255,255,255,.04)', border: '1.5px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }
const button: React.CSSProperties = { background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.8rem', borderRadius: '10px', fontWeight: 700, border: 'none', cursor: 'pointer' }

export default function ConfirmAge() {
  const [step, setStep] = useState<'loading' | 'year' | 'parent' | 'sent'>('loading')
  const [year, setYear] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [deleteAfter, setDeleteAfter] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const currentYear = new Date().getFullYear()

  async function loadStatus() {
    const r = await fetch('/api/account/parent-consent').catch(() => null)
    const d = r && r.ok ? await r.json().catch(() => ({})) : {}
    if (d.paused) { setDeleteAfter(d.deleteAfter ?? null); setStep('parent') }
    else if (d.hasProfile) router.push('/chat')
    else setStep('year')
  }
  useEffect(() => { loadStatus() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function submitYear(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/account/birth-year', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ birthYear: year }),
    })
    const d = await res.json().catch(() => ({}))
    setLoading(false)
    if (res.ok) router.push('/chat')
    else if (d.consentRequired) await loadStatus()
    else setError(d.error || 'Something went wrong.')
  }

  async function submitParent(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/account/parent-consent', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parentEmail }),
    })
    const d = await res.json().catch(() => ({}))
    setLoading(false)
    if (res.ok) setStep('sent')
    else setError(d.error || 'Something went wrong.')
  }

  const until = deleteAfter ? new Date(deleteAfter).toLocaleDateString(undefined, { month: 'long', day: 'numeric' }) : null

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      {step === 'loading' && <p style={{ color: 'var(--text-dim)' }}>Loading…</p>}

      {step === 'year' && (
        <form onSubmit={submitYear} style={box}>
          <h1 style={{ fontWeight: 700, fontSize: '1.3rem' }}>Confirm your birth year</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>We need this once before you can keep using Algegram.</p>
          <input type="number" required min={1900} max={currentYear} value={year} onChange={e => setYear(e.target.value)} placeholder={`e.g. ${currentYear - 16}`} style={input} />
          {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{error}</p>}
          <button type="submit" disabled={loading} style={button}>{loading ? 'Please wait…' : 'Continue →'}</button>
        </form>
      )}

      {step === 'parent' && (
        <form onSubmit={submitParent} style={box}>
          <p style={{ fontSize: '0.9rem', background: 'rgba(108,99,255,.08)', borderRadius: '10px', padding: '0.75rem 1rem', margin: 0 }}>
            👋 Algegram needs a parent's OK for users under 13. Your account is safe — please hand this screen to a parent or guardian.
          </p>
          <h1 style={{ fontWeight: 700, fontSize: '1.3rem' }}>For the parent or guardian</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', lineHeight: 1.6 }}>
            Your child's Algegram account is paused because they are under 13. Enter <strong>your</strong> email address and we'll send you a link to approve it.
            Until you approve, your child can't use the tutor and any subscription is not charged.
            {until ? ` If the account isn't approved by ${until}, it and its data will be deleted (and any charge for the current period refunded).` : ''}
          </p>
          <input type="email" required value={parentEmail} onChange={e => setParentEmail(e.target.value)} placeholder="parent@example.com" style={input} />
          {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{error}</p>}
          <button type="submit" disabled={loading} style={button}>{loading ? 'Sending…' : 'Email me the approval link →'}</button>
        </form>
      )}

      {step === 'sent' && (
        <div style={box}>
          <h1 style={{ fontWeight: 700, fontSize: '1.3rem' }}>Check your inbox</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', lineHeight: 1.6 }}>
            We sent an approval link to {parentEmail}. It works for 1 hour. Once you approve, your child can sign in and keep learning.
          </p>
          <button type="button" onClick={() => setStep('parent')} style={{ ...button, background: 'none', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>Use a different email</button>
        </div>
      )}
    </div>
  )
}
