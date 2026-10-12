import Link from 'next/link'
import { pageMetadata } from '@/lib/seo'
import { HELLO_EMAIL, SUPPORT_EMAIL, PILOT_MAILTO } from '@/lib/site-config'

export const metadata = pageMetadata({
  title: 'Contact | Algegram',
  description: 'Contact the Algegram team for help, privacy, billing, or school and tutoring-center pilots.',
  path: '/contact',
})

export default function Contact() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <nav style={{ borderBottom: '1px solid var(--border)', padding: '0 1rem' }}
        className="flex items-center justify-between h-14 max-w-6xl mx-auto">
        <Link href="/" style={{ fontWeight: 800, fontSize: '1.2rem', background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>
          Algegram
        </Link>
      </nav>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '1rem' }}>Contact Us</h1>
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.8, marginBottom: '2rem' }}>
          We'd love to hear from you — whether it's a bug report, feature request, or privacy question.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🛠️</div>
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Help, privacy & billing</div>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Account help, bug reports, parent and privacy requests, cancellations and refunds</p>
            <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: 'var(--accent2)', textDecoration: 'none' }}>{SUPPORT_EMAIL}</a>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💌</div>
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>General</div>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Questions, ideas and partnerships</p>
            <a href={`mailto:${HELLO_EMAIL}`} style={{ color: 'var(--accent2)', textDecoration: 'none' }}>{HELLO_EMAIL}</a>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🏫</div>
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Schools & Tutoring Centers</div>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>Interested in a pilot for your institution?</p>
            <p style={{ fontSize: '0.875rem', marginBottom: '0.75rem' }}>Email <a href={`mailto:${HELLO_EMAIL}`} style={{ color: 'var(--accent2)', textDecoration: 'none' }}>{HELLO_EMAIL}</a></p>
            <a href={PILOT_MAILTO}
              style={{ display: 'inline-block', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none' }}>
              Request a pilot →
            </a>
          </div>
        </div>
      </div>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <Link href="/terms" style={{ color: 'var(--text-dim)' }}>Terms</Link>
          <Link href="/privacy" style={{ color: 'var(--text-dim)' }}>Privacy</Link>
          <Link href="/contact" style={{ color: 'var(--text-dim)' }}>Contact</Link>
        </div>
        © {new Date().getFullYear()} Algegram
      </footer>
    </div>
  )
}
