'use client'
import { useCenterLink } from '@/lib/center/useCenterLink'

const box = { maxWidth: 720, margin: '0.75rem auto', padding: '0.75rem 1rem', borderRadius: 12, fontSize: '0.95rem', fontWeight: 600, textAlign: 'center' as const, color: 'var(--text)' }

export function CenterBanner({ full, center }: { full: boolean; center: string | null }) {
  if (center) return <div role='status' data-testid='center-banner' style={{ ...box, border: '1px solid rgba(108,99,255,.55)', background: 'rgba(108,99,255,.16)' }}>Joining through {center}: 14 days of Pro.</div>
  if (full) return <div role='status' data-testid='center-full' style={{ ...box, border: '1px solid rgba(251,191,36,.5)', background: 'rgba(251,191,36,.12)' }}>Your center&apos;s seats are full. Ask your teacher.</div>
  return null
}

/** Client banner (static pages): "Joining through <center>" or "seats are full". `initial` = server-rendered state. */
export default function CenterFullNotice({ initial }: { initial?: { full: boolean; center: string | null } }) {
  const c = useCenterLink()
  const s = c.loaded ? c : initial ?? c
  return <CenterBanner full={s.full} center={s.center} />
}
