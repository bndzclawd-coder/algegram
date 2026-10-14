'use client'
import { useEffect, useState } from 'react'

type R = { child?: boolean; available?: boolean; link?: string; rewarded?: number; cap?: number }

export function ReferralCard() {
  const [r, setR] = useState<R | null>(null)
  const [copied, setCopied] = useState(false)
  useEffect(() => { fetch('/api/account/referral', { cache: 'no-store' }).then(x => (x.ok ? x.json() : null)).then(setR).catch(() => {}) }, [])
  if (!r) return (
    <div aria-busy="true" aria-label="Loading your share link" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {[100, 90, 60].map(w => <div key={w} style={{ height: 12, width: `${w}%`, borderRadius: 6, background: 'rgba(255,255,255,.07)' }} />)}
    </div>
  )
  if (r.child) return (
    <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
      Know someone who&apos;d like Layla? Ask a parent before you share algegram.xyz with a friend.
    </p>
  )
  if (!r.available || !r.link) return null
  return (
    <div>
      <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
        Know someone stuck on math homework? Send them your link: <strong style={{ color: 'var(--text)', wordBreak: 'break-all' }}>{r.link}</strong>. They get 5 free questions with no sign-up, and 7 days of Pro free when they sign up. You get 7 more days of Pro for each friend who joins, up to 4. No card needed.
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => { navigator.clipboard?.writeText(r.link!).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }).catch(() => {}) }}
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 0.9rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
          {copied ? 'Copied!' : 'Copy my link'}
        </button>
        <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Friends joined: {r.rewarded ?? 0}/{r.cap ?? 4}</span>
      </div>
    </div>
  )
}
