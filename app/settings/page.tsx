'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Settings() {
  const [user, setUser] = useState<any>(null)
  const [plan, setPlan] = useState<string>('free')
  const [loading, setLoading] = useState(true)
  const [billingLoading, setBillingLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/auth/login'); return }
      setUser(data.user)
      setLoading(false)
    })
  }, [router])

  async function handleManageBilling() {
    setBillingLoading(true)
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else { alert('No billing account found.'); setBillingLoading(false) }
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    const res = await fetch('/api/account/delete', { method: 'POST' })
    if (res.ok) {
      router.push('/?deleted=1')
    } else {
      const d = await res.json().catch(() => ({}))
      alert(d.error || 'Failed to delete account. Please contact support@algegram.xyz')
      setDeleting(false)
    }
  }

  if (loading) return <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'var(--text-dim)' }}>Loading…</p></div>

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <nav style={{ borderBottom: '1px solid var(--border)', padding: '0 1rem' }}
        className="flex items-center justify-between h-14 sm:h-16 max-w-6xl mx-auto">
        <Link href="/" style={{ fontWeight: 800, fontSize: '1.25rem', background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>
          Algegram
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/chat" style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>Chat</Link>
          <a href="mailto:support@algegram.xyz" style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>Help</a>
        </div>
      </nav>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '3rem 1rem' }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.6rem', marginBottom: '2rem' }}>Account Settings</h1>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.25rem' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '1rem' }}>Account</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>{user?.email}</p>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.25rem' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '1rem' }}>Billing</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Manage your subscription, update payment details, or cancel.
          </p>
          <button onClick={handleManageBilling} disabled={billingLoading}
            style={{ background: 'var(--accent)', color: '#fff', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '0.9rem', opacity: billingLoading ? 0.7 : 1 }}>
            {billingLoading ? 'Loading…' : 'Manage billing →'}
          </button>
        </div>

        <div style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.25)', borderRadius: '14px', padding: '1.5rem' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '1rem', color: '#f87171' }}>Danger Zone</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Permanently deletes your account, cancels any active subscription, and removes all your data. This cannot be undone.
          </p>
          {!deleteConfirm ? (
            <button onClick={() => setDeleteConfirm(true)}
              style={{ background: 'none', border: '1px solid rgba(239,68,68,.5)', color: '#f87171', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
              Delete my account and data
            </button>
          ) : (
            <div>
              <p style={{ color: '#f87171', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                Are you absolutely sure? This will cancel your subscription and delete all your data.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button onClick={handleDeleteAccount} disabled={deleting}
                  style={{ background: '#ef4444', color: '#fff', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '0.9rem', opacity: deleting ? 0.7 : 1 }}>
                  {deleting ? 'Deleting…' : 'Yes, delete everything'}
                </button>
                <button onClick={() => setDeleteConfirm(false)}
                  style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-dim)', padding: '0.6rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
