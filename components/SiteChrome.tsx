import Link from 'next/link'

const brand = { fontWeight: 800, fontSize: '1.25rem', background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', flexShrink: 0, textDecoration: 'none' } as const

export function SiteNav() {
  return (
    <nav style={{ borderBottom: '1px solid var(--border)', padding: '0 1rem', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 50 }}
      className='flex items-center justify-between h-14 sm:h-16 max-w-6xl mx-auto'>
      <Link href='/' style={brand}>Algegram</Link>
      <div className='flex gap-3 sm:gap-6 items-center'>
        <Link href='/pricing' style={{ color: 'var(--text)', fontSize: '0.9rem' }}>Pricing</Link>
        <Link href='/auth/login' className='hidden sm:block' style={{ color: 'var(--text)', fontSize: '0.9rem' }}>Sign in</Link>
        <Link href='/auth/signup' style={{ background: 'var(--accent)', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }} className='sm:text-sm sm:px-4'>Get started free</Link>
      </div>
    </nav>
  )
}

export function SiteFooter() {
  const l = { color: 'var(--text-dim)' }
  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
      <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <Link href='/quadratic-equation-solver' style={l}>Quadratic equation solver</Link>
        <Link href='/fraction-calculator' style={l}>Fraction calculator</Link>
        <Link href='/pricing' style={l}>Pricing</Link>
        <Link href='/terms' style={l}>Terms</Link>
        <Link href='/privacy' style={l}>Privacy</Link>
        <Link href='/contact' style={l}>Contact</Link>
        <a href='mailto:support@algegram.xyz' style={l}>Help</a>
      </div>
      © {new Date().getFullYear()} Algegram
    </footer>
  )
}

/** Wraps topic/marketing pages with the shared nav + footer and the site background. */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', overflowX: 'hidden' }}>
      <SiteNav />
      {children}
      <SiteFooter />
    </div>
  )
}
