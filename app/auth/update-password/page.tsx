'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,.04)',
    border: '1.5px solid var(--border)', borderRadius: '10px', color: 'var(--text)',
    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const,
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDone(true)
      setTimeout(() => router.push('/chat'), 2000)
    }
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <Link href="/" style={{ display: 'block', textAlign: 'center', fontWeight: 800, fontSize: '1.4rem', background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '2rem', textDecoration: 'none' }}>
          Algegram
        </Link>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem' }}>
          <h1 style={{ fontWeight: 700, fontSize: '1.4rem', marginBottom: '0.5rem' }}>Set new password</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Choose a strong password for your account.</p>
          {done ? (
            <p style={{ color: 'var(--green)', textAlign: 'center', fontWeight: 600 }}>Password updated! Redirecting…</p>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.4rem' }}>New password</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  style={inputStyle} placeholder="Min. 8 characters" />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.4rem' }}>Confirm password</label>
                <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                  style={inputStyle} placeholder="Repeat password" />
              </div>
              {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{error}</p>}
              <button type="submit" disabled={loading}
                style={{ background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.8rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem', border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Updating…' : 'Update password →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
