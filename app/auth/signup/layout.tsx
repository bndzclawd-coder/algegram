import { CenterBanner } from '@/app/components/CenterFullNotice'
import { centerLinkState } from '@/lib/center/server-banner'

export const dynamic = 'force-dynamic'

// Server-rendered center banner (from the signed center-link cookie), so it shows on every visit.
export default async function SignupLayout({ children }: { children: React.ReactNode }) {
  const s = await centerLinkState()
  return (
    <>
      {(s.center || s.full) && <div style={{ background: 'var(--bg)', padding: '1rem 1rem 0' }}><CenterBanner full={s.full} center={s.center} /></div>}
      {children}
    </>
  )
}
