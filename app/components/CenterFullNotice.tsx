'use client'
import { useCenterLink } from '@/lib/center/useCenterLink'

const box = { maxWidth: 720, margin: '0.75rem auto', padding: '0.75rem 1rem', borderRadius: 12, fontSize: '0.92rem', textAlign: 'center' as const, color: 'var(--text)' }

/** Center-link notice: "Joining through <center>: 14 days of Pro." or "seats are full". Nothing for everyone else. */
export default function CenterFullNotice() {
  const { full, center } = useCenterLink()
  if (center) return <div role='status' data-testid='center-banner' style={{ ...box, border: '1px solid rgba(108,99,255,.45)', background: 'rgba(108,99,255,.12)' }}>Joining through {center}: 14 days of Pro.</div>
  if (full) return <div role='status' data-testid='center-full' style={{ ...box, border: '1px solid rgba(251,191,36,.45)', background: 'rgba(251,191,36,.1)' }}>Your center&apos;s seats are full. Ask your teacher.</div>
  return null
}
