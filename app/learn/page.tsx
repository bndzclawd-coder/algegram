import Link from 'next/link'
import { pageMetadata } from '@/lib/seo'
import { LEARN_PAGES, LEARN_SLUGS } from '@/lib/learn/data'

export const metadata = pageMetadata({
  title: 'Free Math Practice and Step-by-Step Lessons | Algegram',
  description: 'Free math practice pages with worked examples, practice problems with answers and quizzes: fractions, equations, percents, ratios, order of operations and quadratics.',
  path: '/learn',
})

export default function LearnIndex() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', maxWidth: 760, margin: '0 auto', padding: '2.5rem 1.25rem' }}>
      <p><Link href='/' style={{ color: 'var(--accent2)', fontWeight: 800 }}>Algegram</Link></p>
      <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2rem)', margin: '1rem 0' }}>Free math practice, step by step</h1>
      <ul style={{ lineHeight: 2, paddingLeft: '1.2rem', listStyle: 'disc' }}>
        {LEARN_SLUGS.map(s => <li key={s}><Link href={`/learn/${s}`} style={{ color: 'var(--accent2)' }}>{LEARN_PAGES[s].title}</Link> <span style={{ color: 'var(--text-dim)' }}>({LEARN_PAGES[s].audience.split('.')[0]})</span></li>)}
      </ul>
    </main>
  )
}
