'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { hasLessonContent } from '@/lib/whiteboard/parse'

const LaylaWhiteboard = dynamic(() => import('./LaylaWhiteboard'), { ssr: false })

type Status = { allowed: boolean; pro: boolean; locked: boolean; ageRequired?: boolean; child?: boolean }

/** Shown under a finished answer. Only a counter is sent to the server; the answer stays in the browser. */
export default function WatchLaylaButton({ answer }: { answer: string }) {
  const [status, setStatus] = useState<Status | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const usable = hasLessonContent(answer)

  useEffect(() => {
    fetch('/api/lesson/status', { cache: 'no-store' }).then(r => r.json()).then(setStatus).catch(() => {})
  }, [answer])

  if (!usable || !status || status.ageRequired) return null

  const style = { display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, marginLeft: '2.25rem', fontSize: '0.8rem', fontWeight: 700, borderRadius: 999, padding: '0.35rem 0.8rem', border: '1px solid rgba(108,99,255,.45)', background: 'rgba(108,99,255,.14)', color: 'var(--accent2)', cursor: 'pointer', textDecoration: 'none' } as const


  async function start() {
    if (busy) return
    setBusy(true)
    const res = await fetch('/api/lesson/start', { method: 'POST' }).catch(() => null)
    setBusy(false)
    const data = await res?.json().catch(() => null)
    if (res?.ok && data?.allowed) { setOpen(true); setStatus(s => (s && !s.pro ? { ...s, locked: true } : s)) }
    else if (data) setStatus(data)
  }

  return (
    <>
      {status.locked && status.child
        ? <span data-testid='watch-layla-locked-child' style={{ ...style, opacity: 0.85, cursor: 'default' }}>🔒 Watch Layla explain this · back tomorrow</span>
        : status.locked
        ? <a href='/upgrade' rel='nofollow' style={{ ...style, opacity: 0.85 }} aria-label='Watch Layla explain this. Locked: included with Pro'>🔒 Watch Layla explain this · Pro</a>
        : <button type='button' onClick={start} style={style} disabled={busy}>
            🎬 Watch Layla explain this{!status.pro ? ' (1 free a day)' : ''}
          </button>}
      {open && <LaylaWhiteboard answer={answer} onClose={() => setOpen(false)} />}
    </>
  )
}
