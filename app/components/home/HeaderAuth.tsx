'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

// Signed-in visitors see their account links instead of "Sign in". Checks the server session via /api/usage.
export default function HeaderAuth({ className }: { className?: string }) {
  const [state, setState] = useState<null | { signedIn: boolean; pro: boolean }>(null)
  useEffect(() => {
    fetch('/api/usage', { cache: 'no-store' }).then(async r => {
      if (!r.ok) return setState({ signedIn: false, pro: false })
      const d = await r.json().catch(() => null)
      setState({ signedIn: true, pro: d?.plan === 'pro' })
    }).catch(() => setState({ signedIn: false, pro: false }))
  }, [])
  if (state?.signedIn) return (
    <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {state.pro && <span style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--accent2)' }}>Pro</span>}
      <Link href='/chat' className={className}>My chats</Link>
      <Link href='/settings' className={className} aria-label='Account settings'>Account</Link>
    </span>
  )
  return <Link href='/auth/login' className={className} style={{ visibility: state ? 'visible' : 'hidden' }}>Sign in</Link>
}
