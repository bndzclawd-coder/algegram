import Link from 'next/link'
import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import HomepageChat from '@/app/components/HomepageChat'
import { TRY_OWN_LINE } from '@/lib/solve-cta'

// Guest chat reached from the /solve "Try your own problem free" button. Same guest chat and limits as the
// homepage (5 free questions, per-network cap), input focused. Kid-safe: no trial, Pro, upgrade or price
// text, no photo button, and no email/name fields before the normal signup + parent-consent flow.
export const metadata: Metadata = pageMetadata({
  title: 'Try your own math problem | Algegram',
  description: TRY_OWN_LINE,
  path: '/ask',
  noindex: true,
})

export default function AskPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ borderBottom: '1px solid var(--border)', padding: '0 1rem' }} className='flex items-center justify-between h-14 max-w-6xl mx-auto w-full'>
        <Link href='/' style={{ fontWeight: 800, fontSize: '1.2rem', background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>
          Algegram
        </Link>
      </nav>
      <main style={{ flex: 1, paddingTop: '1rem' }}>
        <h1 style={{ textAlign: 'center', fontWeight: 800, fontSize: 'clamp(1.3rem, 5vw, 1.8rem)', margin: '0.5rem 1rem 0.25rem' }}>Try your own problem</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-dim)', margin: '0 1rem', fontSize: '0.95rem' }}>{TRY_OWN_LINE}</p>
        <HomepageChat kidSafe autoFocus />
      </main>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '1.25rem 1rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem', display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href='/terms' style={{ color: 'var(--text-dim)' }}>Terms</Link>
        <Link href='/privacy' style={{ color: 'var(--text-dim)' }}>Privacy</Link>
        <Link href='/help' style={{ color: 'var(--text-dim)' }}>Help</Link>
      </footer>
    </div>
  )
}
