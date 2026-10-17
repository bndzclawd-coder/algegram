'use client'
import { useState } from 'react'

// Fetches one email on tap from the owner-only reveal route. Kept in memory only (no storage).
export default function RevealButton({ id, kid }: { id: string; kid: boolean }) {
  const [email, setEmail] = useState<string | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')
  if (email !== null) return (
    <span className="font-mono text-xs">{kid ? 'Parent: ' : ''}{email || '—'} <button className="ml-1 text-indigo-600 underline" onClick={() => setEmail(null)}>Hide</button></span>
  )
  return (
    <button
      className="text-indigo-600 underline disabled:opacity-50"
      disabled={state === 'loading'}
      onClick={async () => {
        setState('loading')
        try {
          const r = await fetch(`/api/admin/signups/reveal?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
          if (!r.ok) throw new Error()
          const j = await r.json()
          setEmail(typeof j.email === 'string' ? j.email : '')
          setState('idle')
        } catch { setState('error') }
      }}
    >{state === 'error' ? 'Retry' : kid ? 'Show parent' : 'Show'}</button>
  )
}
