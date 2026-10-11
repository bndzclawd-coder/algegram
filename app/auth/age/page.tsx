'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ConfirmAge() {
  const [year, setYear] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const currentYear = new Date().getFullYear()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/account/birth-year', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ birthYear: year }),
    })
    const d = await res.json().catch(() => ({}))
    setLoading(false)
    if (res.ok) router.push('/chat')
    else setError(d.error || 'Something went wrong.')
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <form onSubmit={submit} style={{ width: '100%', maxWidth: '380px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h1 style={{ fontWeight: 700, fontSize: '1.3rem' }}>Confirm your birth year</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>We need this once before you can keep using Algegram.</p>
        <input type="number" required min={1900} max={currentYear} value={year} onChange={e => setYear(e.target.value)}
          placeholder={`e.g. ${currentYear - 16}`}
          style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,.04)', border: '1.5px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }} />
        {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.8rem', borderRadius: '10px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
          {loading ? 'Please wait…' : 'Continue →'}
        </button>
      </form>
    </div>
  )
}
