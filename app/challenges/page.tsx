import Link from 'next/link'
import { pageMetadata } from '@/lib/seo'
import { releasedChallenges, nextChallenge } from '@/lib/challenges/data'
import OfferText from '@/app/components/OfferText'

// Re-render at most once a minute so each challenge appears shortly after its 5 PM PT post time.
export const revalidate = 60

export const metadata = pageMetadata({
  title: '10-Second Math Challenges with Step-by-Step Answers | Algegram',
  description: 'Try each equation in 10 seconds, then check the answer and see every step worked out. New challenges added each week.',
  path: '/challenges',
})

const btn = { background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.85rem 1.25rem', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', textDecoration: 'none', display: 'block', textAlign: 'center' as const }

export default function Challenges() {
  const now = Date.now()
  const list = releasedChallenges(now)
  const next = nextChallenge(now)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <nav style={{ borderBottom: '1px solid var(--border)', padding: '0 1rem' }}
        className="flex items-center justify-between h-14 max-w-6xl mx-auto">
        <Link href="/" style={{ fontWeight: 800, fontSize: '1.2rem', background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>
          Algegram
        </Link>
        <Link href="/auth/signup?utm_source=social&utm_medium=bio&utm_campaign=challenges" style={{ background: 'var(--accent)', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
          Get started free
        </Link>
      </nav>

      <main style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.25rem 3rem' }}>
        <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.6rem, 6vw, 2rem)', marginBottom: '0.75rem' }}>10-second math challenges</h1>
        <p style={{ lineHeight: 1.7, marginBottom: '0.5rem' }}>
          Give yourself 10 seconds to solve each equation in your head or on paper. Then tap to check your answer and see every step, so you know <em>why</em> it works.
        </p>
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: '1.75rem', fontSize: '0.95rem' }}>
          Tip: work backwards. Undo the last thing that was done to x first, then keep going until x is on its own.
        </p>

        {list.length === 0 ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
            <p style={{ fontWeight: 700, marginBottom: '0.4rem' }}>The first challenge is coming soon</p>
            {next && <p style={{ color: 'var(--text-dim)', margin: 0 }}>It goes up {next.dateLabel} at 5 PM PT. Until then, warm up with these:</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem' }}>
              <Link href="/learn/two-step-equations" style={{ color: 'var(--accent2)' }}>Two-step equations explained</Link>
              <Link href="/quiz/linear-equations" style={{ color: 'var(--accent2)' }}>Free linear equations quiz</Link>
            </div>
          </div>
        ) : (
          <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {list.map((c, i) => (
              <li key={c.solvePath} style={{ background: 'var(--surface)', border: i === 0 ? '1px solid rgba(108,99,255,.5)' : '1px solid var(--border)', borderRadius: '14px', padding: '1.25rem' }}>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>{i === 0 ? `Newest · ${c.dateLabel}` : c.dateLabel}</div>
                <p style={{ fontWeight: 800, fontSize: '1.6rem', margin: '0 0 0.9rem', letterSpacing: '0.01em' }}>Solve {c.equation}</p>
                <details style={{ marginBottom: '0.9rem' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--accent2)', padding: '0.5rem 0', minHeight: 44 }}>Show the answer</summary>
                  <p style={{ fontWeight: 700, fontSize: '1.15rem', margin: '0.25rem 0 0' }}>{c.answer}</p>
                </details>
                <Link href={c.solvePath} style={btn}>See the steps →</Link>
              </li>
            ))}
          </ol>
        )}

        {list.length > 0 && next && (
          <p style={{ color: 'var(--text-dim)', textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Next challenge: {next.dateLabel} at 5 PM PT.</p>
        )}

        <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(108,99,255,.1)', border: '1px solid rgba(108,99,255,.3)', borderRadius: '16px' }}>
          <p style={{ color: 'var(--text-dim)', marginBottom: '1rem' }}>
            <OfferText normal='Sign up free, get 7 days of Pro. No card needed.' center='Sign up free with your center for 14 days of Pro.' />
          </p>
          <Link href="/auth/signup?utm_source=social&utm_medium=bio&utm_campaign=challenges" style={btn}>
            <OfferText normal='Sign up free, get 7 days of Pro' center='Sign up free' /> →
          </Link>
        </div>
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <Link href="/terms" style={{ color: 'var(--text-dim)' }}>Terms</Link>
          <Link href="/privacy" style={{ color: 'var(--text-dim)' }}>Privacy</Link>
          <Link href="/help" style={{ color: 'var(--text-dim)' }}>Help</Link>
          <Link href="/contact" style={{ color: 'var(--text-dim)' }}>Contact</Link>
        </div>
        © {new Date().getFullYear()} Algegram
      </footer>
    </div>
  )
}
