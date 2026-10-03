'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || '/chat'

  const [supabase] = useState(() => typeof window === 'undefined' ? null : createClient())

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (!supabase) return
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push(next)
  }

  async function handleForgotPassword() {
    if (!supabase || !email) {
      setError('Enter your email address above, then click Forgot password.')
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/auth/update-password`,
    })
    if (error) setError(error.message)
    else setResetSent(true)
  }

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,.04)',
    border: '1.5px solid var(--border)', borderRadius: '10px', color: 'var(--text)',
    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <Link href="/" style={{ display: 'block', textAlign: 'center', fontWeight: 800, fontSize: '1.4rem', background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '2rem', textDecoration: 'none' }}>
          Algegram
        </Link>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem' }}>
          <h1 style={{ fontWeight: 700, fontSize: '1.4rem', marginBottom: '1.5rem' }}>Welcome back</h1>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.4rem' }}>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                style={inputStyle} placeholder="you@example.com" />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Password</label>
                <button type="button" onClick={handleForgotPassword}
                  style={{ background: 'none', border: 'none', color: 'var(--accent2)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}>
                  Forgot password?
                </button>
              </div>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                style={inputStyle} placeholder="••••••••" />
            </div>
            {resetSent && <p style={{ color: 'var(--green)', fontSize: '0.85rem' }}>Password reset email sent — check your inbox.</p>}
            {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{error}</p>}
            <button type="submit" disabled={loading}
              style={{ background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.8rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem', border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-dim)' }}>
            No account? <Link href="/auth/signup" style={{ color: 'var(--accent2)' }}>Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Login() {
  return <Suspense fallback={null}><LoginForm /></Suspense>
}
