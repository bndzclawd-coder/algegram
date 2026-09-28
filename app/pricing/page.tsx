'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PLANS } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/client'

export default function Pricing() {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  async function handleUpgrade() {
    if (!user) {
      router.push('/auth/signup?plan=pro')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <nav style={{ borderBottom: '1px solid var(--border)', padding: '0 2rem' }}
        className="flex items-center justify-between h-16 max-w-6xl mx-auto">
        <Link href="/" style={{ fontWeight: 800, fontSize: '1.25rem', background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>
          Algegram
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/auth/login" style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>Sign in</Link>
          <Link href="/auth/signup" style={{ background: 'var(--accent)', color: '#fff', padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600 }}>
            Get started
          </Link>
        </div>
      </nav>
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-24 text-center">
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>Simple, transparent pricing</h1>
        <p style={{ color: 'var(--text-dim)', marginBottom: '3.5rem', fontSize: '1.05rem' }}>Start free. No credit card. No stress.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1.5rem', textAlign: 'left' }}>
          {/* Free */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem' }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Free</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>$0</div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Forever free</div>
            <Link href="/auth/signup"
              style={{ display: 'block', textAlign: 'center', background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text)', padding: '0.7rem', borderRadius: '10px', fontWeight: 600, marginBottom: '1.5rem' }}>
              Get started
            </Link>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {PLANS.free.features.map(f => (
                <li key={f} style={{ display: 'flex', gap: '0.6rem', fontSize: '0.875rem', color: 'var(--text-dim)' }}>
                  <span style={{ color: 'var(--green)' }}>&#10003;</span> {f}
                </li>
              ))}
            </ul>
          </div>
          {/* Pro */}
          <div style={{ background: 'linear-gradient(135deg,rgba(108,99,255,.15),rgba(167,139,250,.08))', border: '1.5px solid rgba(108,99,255,.5)', borderRadius: '16px', padding: '2rem', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-0.75rem', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#fff', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.9rem', borderRadius: '999px' }}>
              MOST POPULAR
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Pro</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>$12.99</span>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>/month</span>
            </div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Billed monthly &middot; Cancel anytime</div>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              style={{ display: 'block', width: '100%', textAlign: 'center', background: loading ? '#555' : 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.7rem', borderRadius: '10px', fontWeight: 700, marginBottom: '1.5rem', boxShadow: '0 0 20px rgba(108,99,255,.35)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem' }}>
              {loading ? 'Loading...' : 'Start Pro free trial →'}
            </button>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {PLANS.pro.features.map(f => (
                <li key={f} style={{ display: 'flex', gap: '0.6rem', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--accent2)' }}>&#10003;</span> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p style={{ marginTop: '2rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
          All plans include 256-bit encryption &middot; GDPR compliant &middot; Payments secured by Stripe
        </p>
      </div>
    </div>
  )
}
