import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — Algegram',
  description: 'Algegram Terms of Service. Read our terms covering SaaS subscription, age restrictions, and parental consent.',
  alternates: { canonical: 'https://www.algegram.xyz/terms' },
}

export default function Terms() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <nav style={{ borderBottom: '1px solid var(--border)', padding: '0 1rem' }}
        className="flex items-center justify-between h-14 max-w-6xl mx-auto">
        <Link href="/" style={{ fontWeight: 800, fontSize: '1.2rem', background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>
          Algegram
        </Link>
      </nav>

      <article style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem', lineHeight: 1.8 }}>
        <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0.5rem' }}>Terms of Service</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginBottom: '2.5rem' }}>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <h2 style={{ fontWeight: 700, fontSize: '1.15rem', marginTop: '2rem', marginBottom: '0.5rem' }}>1. Acceptance of Terms</h2>
        <p style={{ color: 'var(--text-dim)' }}>By accessing or using Algegram ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>

        <h2 style={{ fontWeight: 700, fontSize: '1.15rem', marginTop: '2rem', marginBottom: '0.5rem' }}>2. Description of Service</h2>
        <p style={{ color: 'var(--text-dim)' }}>Algegram is an AI-powered math tutoring service that provides step-by-step solutions to math problems. The Service is provided on a SaaS (Software as a Service) subscription basis.</p>

        <h2 style={{ fontWeight: 700, fontSize: '1.15rem', marginTop: '2rem', marginBottom: '0.5rem' }}>3. Age Requirements & Parental Consent</h2>
        <p style={{ color: 'var(--text-dim)' }}>Users must be at least 13 years old to create an account independently. Users under 13 may only use the Service with verifiable parental consent. We comply with the Children's Online Privacy Protection Act (COPPA). If we discover that a child under 13 has provided personal information without parental consent, we will promptly delete such information.</p>
        <p style={{ color: 'var(--text-dim)', marginTop: '0.75rem' }}>For users aged 13–17, a parent or guardian should review and agree to these Terms on the user's behalf.</p>

        <h2 style={{ fontWeight: 700, fontSize: '1.15rem', marginTop: '2rem', marginBottom: '0.5rem' }}>4. Subscription & Billing</h2>
        <p style={{ color: 'var(--text-dim)' }}>Algegram offers a free tier and a Pro paid subscription at $12.99/month. Pro subscriptions include a 7-day free trial. After the trial period, your payment method will be charged the monthly fee unless you cancel. You may cancel at any time; access continues until the end of the current billing period. Payments are processed securely by Stripe.</p>

        <h2 style={{ fontWeight: 700, fontSize: '1.15rem', marginTop: '2rem', marginBottom: '0.5rem' }}>5. Acceptable Use</h2>
        <p style={{ color: 'var(--text-dim)' }}>You agree to use the Service for lawful educational purposes only. You may not use the Service to facilitate academic dishonesty, circumvent access controls, or reverse-engineer the Service.</p>

        <h2 style={{ fontWeight: 700, fontSize: '1.15rem', marginTop: '2rem', marginBottom: '0.5rem' }}>6. AI-Generated Content</h2>
        <p style={{ color: 'var(--text-dim)' }}>The Service uses large language models to generate responses. AI responses may contain errors. Always verify important mathematical work with a qualified human teacher or professor. Algegram is not liable for errors in AI-generated content.</p>

        <h2 style={{ fontWeight: 700, fontSize: '1.15rem', marginTop: '2rem', marginBottom: '0.5rem' }}>7. Privacy</h2>
        <p style={{ color: 'var(--text-dim)' }}>Your use of the Service is also governed by our <Link href="/privacy" style={{ color: 'var(--accent2)' }}>Privacy Policy</Link>.</p>

        <h2 style={{ fontWeight: 700, fontSize: '1.15rem', marginTop: '2rem', marginBottom: '0.5rem' }}>8. Termination</h2>
        <p style={{ color: 'var(--text-dim)' }}>We may suspend or terminate your account if you violate these Terms. You may delete your account at any time from Settings.</p>

        <h2 style={{ fontWeight: 700, fontSize: '1.15rem', marginTop: '2rem', marginBottom: '0.5rem' }}>9. Limitation of Liability</h2>
        <p style={{ color: 'var(--text-dim)' }}>Algegram is provided "as is" without warranty of any kind. To the maximum extent permitted by law, Algegram's liability for any claim is limited to the amount you paid in the 12 months preceding the claim.</p>

        <h2 style={{ fontWeight: 700, fontSize: '1.15rem', marginTop: '2rem', marginBottom: '0.5rem' }}>10. Changes to Terms</h2>
        <p style={{ color: 'var(--text-dim)' }}>We may update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>

        <h2 style={{ fontWeight: 700, fontSize: '1.15rem', marginTop: '2rem', marginBottom: '0.5rem' }}>11. Contact</h2>
        <p style={{ color: 'var(--text-dim)' }}>Questions about these Terms? Email <a href="mailto:hello@algegram.xyz" style={{ color: 'var(--accent2)' }}>hello@algegram.xyz</a></p>
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
