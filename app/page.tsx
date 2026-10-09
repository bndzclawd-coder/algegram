import Link from 'next/link'
import HomepageChat from '@/app/components/HomepageChat'

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://www.algegram.xyz/#org',
      name: 'Algegram',
      url: 'https://www.algegram.xyz',
      logo: 'https://www.algegram.xyz/og-image.png',
      contactPoint: { '@type': 'ContactPoint', email: 'hello@algegram.xyz', contactType: 'customer support' },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://www.algegram.xyz/#website',
      url: 'https://www.algegram.xyz',
      name: 'Algegram',
      publisher: { '@id': 'https://www.algegram.xyz/#org' },
    },
  ],
}

const TOPICS = [
  { icon: '∫', title: 'Calculus', desc: 'Derivatives, integrals, limits, series — with full workings.' },
  { icon: '√', title: 'Algebra', desc: 'Solve equations, factor polynomials, simplify expressions.' },
  { icon: '∑', title: 'Statistics', desc: 'Probability, distributions, hypothesis testing.' },
  { icon: 'λ', title: 'Linear Algebra', desc: 'Matrices, eigenvalues, vector spaces.' },
  { icon: '📈', title: 'Graphing', desc: 'Understand and describe functions with LaTeX.' },
  { icon: '🔢', title: 'Number Theory', desc: 'Primes, modular arithmetic, combinatorics.' },
]

export default function Home({ searchParams }: { searchParams: { code?: string; type?: string } }) {
  // Supabase falls back to site root when redirectTo isn't in allowlist
  // Forward the code to the proper callback handler
  if (searchParams?.code) {
    const next = searchParams?.type === 'recovery' ? '/auth/update-password' : '/chat'
    redirect(`/auth/callback?code=${searchParams.code}&next=${next}`)
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', overflowX: 'hidden' }}>
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />

      <nav style={{ borderBottom: '1px solid var(--border)', padding: '0 1rem', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 50 }}
        className='flex items-center justify-between h-14 sm:h-16 max-w-6xl mx-auto'>
        <span style={{ fontWeight: 800, fontSize: '1.25rem', background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', flexShrink: 0 }}>Algegram</span>
        <div className='flex gap-3 sm:gap-6 items-center'>
          <Link href='/pricing' className='hidden sm:block' style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Pricing</Link>
          <Link href='/auth/login' className='hidden sm:block' style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Sign in</Link>
          <Link href='/auth/signup' style={{ background: 'var(--accent)', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }} className='sm:text-sm sm:px-4'>Get started free</Link>
        </div>
      </nav>

      {/* Static hero heading — server-rendered for SEO */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '2.5rem 1rem 0', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem,5vw,3.25rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '1rem' }}>
          Ask any math question.<br />
          <span style={{ background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Get step-by-step answers instantly. 📐
          </span>
        </h1>
        <p style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.05rem)', color: 'var(--text-dim)', maxWidth: '520px', margin: '0 auto' }}>
          From basic arithmetic to university-level calculus — just type your question below.
        </p>
      </div>

      {/* Interactive chat widget */}
      <HomepageChat />

      {/* Static features section — server-rendered for SEO */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem 4rem' }}>
        <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: 'clamp(1.1rem, 3vw, 1.5rem)', marginBottom: '2rem', color: 'var(--text-dim)' }}>Covers every branch of math</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1rem' }}>
          {TOPICS.map(f => (
            <a key={f.title} href='#chat' style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.25rem', textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.6rem' }}>{f.icon}</div>
              <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>{f.title}</div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', lineHeight: 1.6 }}>{f.desc}</div>
            </a>
          ))}
        </div>
      </section>

      <section style={{ borderTop: '1px solid var(--border)', padding: '3rem 1rem', textAlign: 'center', background: 'rgba(108,99,255,.04)' }}>
        <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.3rem, 4vw, 1.75rem)', marginBottom: '0.75rem' }}>For Tutoring Centers &amp; Schools</h2>
        <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem', fontSize: 'clamp(0.875rem, 2.5vw, 1rem)', maxWidth: 520, margin: '0 auto 1.5rem' }}>
          Give every student their own AI math tutor — available 24/7.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, maxWidth: 440, margin: '0 auto 2rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <li style={{ display: 'flex', gap: '0.6rem', fontSize: '0.925rem' }}><span style={{ color: 'var(--accent2)' }}>✓</span> Reduce teacher workload with instant step-by-step explanations</li>
          <li style={{ display: 'flex', gap: '0.6rem', fontSize: '0.925rem' }}><span style={{ color: 'var(--accent2)' }}>✓</span> Works across all levels — from pre-algebra to calculus</li>
          <li style={{ display: 'flex', gap: '0.6rem', fontSize: '0.925rem' }}><span style={{ color: 'var(--accent2)' }}>✓</span> COPPA-compliant with parental consent for under-13 learners</li>
        </ul>
        <a href='mailto:hello@algegram.xyz?subject=Pilot Request'
          style={{ display: 'inline-block', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.8rem 2rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none' }}>
          Request a pilot →
        </a>
      </section>

      <section style={{ borderTop: '1px solid var(--border)', padding: '3rem 1rem', textAlign: 'center' }}>
        <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.3rem, 4vw, 1.75rem)', marginBottom: '0.75rem' }}>Want unlimited questions?</h2>
        <p style={{ color: 'var(--text-dim)', marginBottom: '1.75rem', fontSize: 'clamp(0.875rem, 2.5vw, 1rem)' }}>Sign up free for 20/day, or go Pro for unlimited access to GPT-4o &amp; Claude.</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href='/auth/signup' style={{ background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.8rem 2rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none' }}>Sign up free →</Link>
          <Link href='/pricing' style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.8rem 2rem', borderRadius: '12px', fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none' }}>See pricing</Link>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <Link href='/terms' style={{ color: 'var(--text-dim)' }}>Terms</Link>
          <Link href='/privacy' style={{ color: 'var(--text-dim)' }}>Privacy</Link>
          <Link href='/contact' style={{ color: 'var(--text-dim)' }}>Contact</Link>
          <a href='mailto:support@algegram.xyz' style={{ color: 'var(--text-dim)' }}>Help</a>
          <Link href='/pricing' style={{ color: 'var(--text-dim)' }}>Pricing</Link>
        </div>
        © {new Date().getFullYear()} Algegram · Built with ❤️ and AI
      </footer>
    </div>
  )
}
