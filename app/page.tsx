import Link from 'next/link'
import { redirect } from 'next/navigation'
import HomepageChat from '@/app/components/HomepageChat'
import { WorkedExample, type Example } from '@/components/WorkedExample'
import { JsonLd } from '@/components/JsonLd'
import { SiteNav, SiteFooter } from '@/components/SiteChrome'
import { pageMetadata } from '@/lib/seo'
import {
  SITE_URL, PILOT_MAILTO, MAILBOX_LIVE, PRO_PRICE_TEXT, PRO_OFFER_TEXT, PRO_CTA_TEXT,
  GUEST_FREE_QUESTIONS, FREE_DAILY_QUESTIONS,
} from '@/lib/site-config'

export const metadata = pageMetadata({
  title: 'Algegram – AI Math Tutor with Step-by-Step Answers',
  description: `Type any math problem and see every step explained, from fractions to calculus. ${GUEST_FREE_QUESTIONS} free questions with no sign-up.`,
  path: '/',
})

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#org`,
      name: 'Algegram',
      url: SITE_URL,
      logo: `${SITE_URL}/icon.png`,
      ...(MAILBOX_LIVE ? { email: 'hello@algegram.xyz' } : {}),
      ...(MAILBOX_LIVE ? { contactPoint: { '@type': 'ContactPoint', email: 'support@algegram.xyz', contactType: 'customer support' } } : {}),
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'Algegram',
      publisher: { '@id': `${SITE_URL}/#org` },
    },
  ],
}

const example: Example = {
  id: 'example',
  title: 'See how it works: a worked example',
  problem: 'Solve 2x + 5 = 17',
  steps: [
    { math: '2x + 5 − 5 = 17 − 5', why: 'Subtract 5 from both sides to get the x-term by itself.' },
    { math: '2x = 12', why: 'Simplify both sides.' },
    { math: '2x ÷ 2 = 12 ÷ 2', why: 'Divide both sides by 2, the number multiplying x.' },
    { math: 'x = 6', why: 'Simplify.' },
  ],
  answer: 'x = 6',
  check: '2(6) + 5 = 12 + 5 = 17 ✓',
}

// Only link pages that exist and are ready. /ai-math-tutor-for-kids is held back until
// parental consent + privacy features it describes are confirmed live.
const TOPICS = [
  { href: '/fraction-calculator', icon: '½', title: 'Fractions', body: 'Add, subtract, multiply and divide fractions, with every step shown.' },
  { href: '/quadratic-equation-solver', icon: 'x²', title: 'Quadratic equations', body: 'Factoring, the quadratic formula and completing the square.' },
  { href: '/solve/algebra', icon: '√', title: 'Algebra', body: 'Solve equations, factor polynomials, simplify expressions.' },
  { href: '/solve/calculus', icon: '∫', title: 'Calculus', body: 'Derivatives, integrals, limits and series, with full workings.' },
  { href: '/solve/statistics', icon: '∑', title: 'Statistics', body: 'Probability, distributions, hypothesis testing.' },
  { href: '/solve/linear-algebra', icon: 'λ', title: 'Linear algebra', body: 'Matrices, eigenvalues, vector spaces.' },
]

const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', textDecoration: 'none', color: 'var(--text)', display: 'block' } as const
const h2 = { textAlign: 'center', fontWeight: 800, fontSize: 'clamp(1.3rem,4vw,1.75rem)', marginBottom: '1.5rem' } as const

export default function Home({ searchParams }: { searchParams: { code?: string; type?: string } }) {
  // Supabase falls back to the site root when redirectTo isn't in its allowlist.
  // Forward the code to the proper callback handler.
  if (searchParams?.code) {
    const next = searchParams?.type === 'recovery' ? '/auth/update-password' : '/chat'
    redirect(`/auth/callback?code=${encodeURIComponent(searchParams.code)}&next=${encodeURIComponent(next)}`)
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', overflowX: 'hidden' }}>
      <JsonLd data={JSON_LD} />
      <SiteNav />

      <main>
        {/* Hero: server-rendered heading, then the live guest solver (5 free questions, no sign-up) */}
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '2.5rem 1rem 0', textAlign: 'center' }}>
          <h1 style={{ fontSize: 'clamp(1.75rem,5vw,3.25rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '1rem' }}>
            Try a free math question.<br />
            <span style={{ background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              See every step explained. 📐
            </span>
          </h1>
          <p style={{ fontSize: 'clamp(0.9rem,2.5vw,1.05rem)', color: 'var(--text-dim)', maxWidth: 540, margin: '0 auto' }}>
            From fractions and first equations to university calculus. Type your question below.
          </p>
        </div>

        <HomepageChat />

        <section style={{ maxWidth: 760, margin: '0 auto', padding: '1rem 1rem 1rem' }}>
          <WorkedExample ex={example} headingLevel={2} />
        </section>

        <section style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
          <h2 style={h2}>Pick a topic</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '1rem' }}>
            {TOPICS.map(t => (
              <Link key={t.href} href={t.href} style={card}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.6rem' }} aria-hidden>{t.icon}</div>
                <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>{t.title} →</div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', lineHeight: 1.6 }}>{t.body}</div>
              </Link>
            ))}
          </div>
        </section>

        <section style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
          <h2 style={h2}>Free vs Pro</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1rem' }}>
            <div style={card}>
              <div style={{ fontWeight: 700 }}>Free · $0</div>
              <ul style={{ color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: 1.8, marginTop: '0.5rem' }}>
                <li>✓ {GUEST_FREE_QUESTIONS} questions without signing up</li>
                <li>✓ {FREE_DAILY_QUESTIONS} questions a day with a free account</li>
                <li>✓ Step-by-step explanations</li>
              </ul>
            </div>
            <div style={card}>
              <div style={{ fontWeight: 700 }}>Pro · {PRO_PRICE_TEXT}</div>
              <ul style={{ color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: 1.8, marginTop: '0.5rem' }}>
                <li>✓ Unlimited questions</li>
                <li>✓ Stronger AI models</li>
                <li>✓ Saved question history</li>
              </ul>
              {PRO_OFFER_TEXT && <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>{PRO_OFFER_TEXT}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <Link href='/auth/signup' style={{ background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.8rem 2rem', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>Sign up free →</Link>
            <Link href='/pricing' style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.8rem 2rem', borderRadius: 12, fontWeight: 600, textDecoration: 'none' }}>{PRO_CTA_TEXT}</Link>
          </div>
        </section>

        {MAILBOX_LIVE && (
        <section id='pilot' style={{ borderTop: '1px solid var(--border)', padding: '3rem 1rem', textAlign: 'center', background: 'rgba(108,99,255,.04)' }}>
          <h2 style={{ ...h2, marginBottom: '0.75rem' }}>For tutoring centers &amp; schools</h2>
          <p style={{ color: 'var(--text-dim)', maxWidth: 560, margin: '0 auto 1.5rem' }}>
            Want to try Algegram with a group of students? Tell us about your center or class and we’ll set up a pilot.
          </p>
          <a href={PILOT_MAILTO}
            style={{ display: 'inline-block', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.8rem 2rem', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>
            Request a pilot →
          </a>
        </section>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
