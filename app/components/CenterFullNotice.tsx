'use client'
import { useEffect, useState } from 'react'

/** "Seats full" notice for center-link visitors. Shows nothing for everyone else. */
export default function CenterFullNotice() {
  const [full, setFull] = useState(false)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('center') === 'full') setFull(true)
    fetch('/api/center/status', { cache: 'no-store' }).then(r => r.json()).then(d => { if (d?.full) setFull(true) }).catch(() => {})
  }, [])
  if (!full) return null
  return (
    <div role='status' data-testid='center-full' style={{ maxWidth: 720, margin: '0.75rem auto', padding: '0.75rem 1rem', borderRadius: 12, border: '1px solid rgba(251,191,36,.45)', background: 'rgba(251,191,36,.1)', color: 'var(--text)', fontSize: '0.92rem', textAlign: 'center' }}>
      Your center&apos;s seats are full. Ask your teacher.
    </div>
  )
}
