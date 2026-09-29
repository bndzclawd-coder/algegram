import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Algegram',
  description: 'Algegram Privacy Policy. Learn what data we collect, how we protect it, and your rights under GDPR and COPPA.',
  alternates: { canonical: 'https://www.algegram.xyz/privacy' },
}

export default function Privacy() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <nav style={{ borderBottom: '1px solid var(--border)', padding: '0 1rem' }}
        className="flex items-center justify-between h-14 max-w-6xl mx-auto">
        <Link href="/" style={{ fontWeight: 800, fontSize: '1.2rem', background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>
          Algegram
        </Link>
      </nav>

      <article style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem', lineHeight: 1.8 }}>
        <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0.5rem' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginBottom: '2.5rem' }}>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <h2 style={{ fontWeight: 700, fontSize: '1.15rem', marginTop: '2rem', marginBottom: '0.5rem' }}>1. Who We Are</h2>
        <p style={{ color: 'var(--text-dim)' }}>Algegram ("we", "us", "our") operates the AI math tutoring service at algegram.xyz. Contact: <a href="mailto:privacy@algegram.xyz" style={{ color: 'var(--accent2)' }}>privacy@algegram.xyz</a></p>

        <h2 style={{ fontWeight: 700, fontSize: '1.15rem', marginTop: '2rem', marginBottom: '0.5rem' }}>2. Data We Collect</h2>
        <p style={{ color: 'var(--text-dim)', marginBottom: '0.75rem' }}><strong style={{ color: 'var(--text)' }}>For all users (including guests):</strong></p>
        <ul style={{ color: 'var(--text-dim)', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <li>Basic server logs (error logs only, no question content)</li>
          <li>IP addresses (hashed with a daily rotating salt for rate-limiting only; never stored persistently or linked to question content)</li>
        </ul>
        <p style={{ color: 'var(--text-dim)', marginTop: '0.75rem', marginBottom: '0.75rem' }}><strong style={{ color: 'var(--text)' }}>Guest (not logged in):</strong> We do not store, log, or transmit math questions. No guest question history is retained on our servers.</p>
        <p style={{ color: 'var(--text-dim)', marginBottom: '0.75rem' }}><strong style={{ color: 'var(--text)' }}>Registered users (13+):</strong></p>
        <ul style={{ color: 'var(--text-dim)', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <li>Email address (required for account creation)</li>
          <li>Usage counts (number of questions per day, without question content)</li>
          <li>Subscription status (if Pro subscriber)</li>
        </ul>
        <p style={{ color: 'var(--text-dim)', marginTop: '0.75rem', marginBottom: '0.75rem' }}><strong style={{ color: 'var(--text)' }}>Under-13 users (with parental consent):</strong></p>
        <ul style={{ color: 'var(--text-dim)', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <li>Email address and birth year (provided by parent)</li>
          <li>No question history until explicit parental opt-in</li>
          <li>Parent email (used only for consent verification)</li>
        </ul>

        <h2 style={{ fontWeight: 700, fontSize: '1.15rem', marginTop: '2rem', marginBottom: '0.5rem' }}>3. AI Requests & Third Parties</h2>
        <p style={{ color: 'var(--text-dim)' }}>Math questions are sent to OpenRouter (and through them to AI model providers) solely to generate responses. We configure all requests with <code style={{ background: 'rgba(255,255,255,.06)', padding: '0 4px', borderRadius: '4px' }}>data_collection: "deny"</code> to prevent AI providers from using your queries for training. Guest questions are never stored on our side and sent without any user identifier.</p>

        <h2 style={{ fontWeight: 700, fontSize: '1.15rem', marginTop: '2rem', marginBottom: '0.5rem' }}>4. Payments</h2>
        <p style={{ color: 'var(--text-dim)' }}>Payments are processed by Stripe. We do not store card numbers. We receive and store only a Stripe customer ID and subscription status.</p>

        <h2 style={{ fontWeight: 700, fontSize: '1.15rem', marginTop: '2rem', marginBottom: '0.5rem' }}>5. GDPR (EEA Users)</h2>
        <p style={{ color: 'var(--text-dim)' }}>You have the right to access, correct, or delete your personal data. To exercise these rights, email <a href="mailto:privacy@algegram.xyz" style={{ color: 'var(--accent2)' }}>privacy@algegram.xyz</a>. You may also delete your account at any time from Account Settings. Your data will be erased within 30 days of deletion.</p>

        <h2 style={{ fontWeight: 700, fontSize: '1.15rem', marginTop: '2rem', marginBottom: '0.5rem' }}>6. COPPA (Children Under 13)</h2>
        <p style={{ color: 'var(--text-dim)' }}>We comply with the Children's Online Privacy Protection Act. We do not knowingly collect personal information from children under 13 without verifiable parental consent. If you believe we have inadvertently collected such information, please contact <a href="mailto:privacy@algegram.xyz" style={{ color: 'var(--accent2)' }}>privacy@algegram.xyz</a> immediately.</p>

        <h2 style={{ fontWeight: 700, fontSize: '1.15rem', marginTop: '2rem', marginBottom: '0.5rem' }}>7. Cookies</h2>
        <p style={{ color: 'var(--text-dim)' }}>We use essential cookies only: authentication session cookies (Supabase) and a signed HttpOnly cookie to count guest questions. We do not use advertising or tracking cookies.</p>

        <h2 style={{ fontWeight: 700, fontSize: '1.15rem', marginTop: '2rem', marginBottom: '0.5rem' }}>8. Data Retention</h2>
        <p style={{ color: 'var(--text-dim)' }}>Account data is retained until you delete your account. Usage counts are retained for 90 days. Hashed IP rate-limit counters expire after 4 hours.</p>

        <h2 style={{ fontWeight: 700, fontSize: '1.15rem', marginTop: '2rem', marginBottom: '0.5rem' }}>9. Contact</h2>
        <p style={{ color: 'var(--text-dim)' }}>Privacy questions: <a href="mailto:privacy@algegram.xyz" style={{ color: 'var(--accent2)' }}>privacy@algegram.xyz</a></p>
      </article>

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
