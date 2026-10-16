import Link from 'next/link'
import { notFound } from 'next/navigation'
import { pageMetadata } from '@/lib/seo'
import { GUEST_FREE_QUESTIONS, SITE_URL } from '@/lib/site-config'
import { LEARN_PAGES, LEARN_SLUGS } from '@/lib/learn/data'

// Seeded, hand-written content only. Never render user-typed questions here.
export const dynamicParams = false
export function generateStaticParams() { return LEARN_SLUGS.map(slug => ({ slug })) }

export function generateMetadata({ params }: { params: { slug: string } }) {
  const p = LEARN_PAGES[params.slug]
  if (!p) return { robots: { index: false } }
  return pageMetadata({ title: `${p.seoTitle} | Algegram`, description: p.description, path: `/learn/${params.slug}` })
}

const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem 1.5rem' }

export default function LearnPage({ params }: { params: { slug: string } }) {
  const p = LEARN_PAGES[params.slug]
  if (!p) notFound()
  const url = `${SITE_URL}/learn/${params.slug}`
  const cta = `/?utm_source=seo&utm_medium=organic&utm_campaign=${p.campaign}`
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'LearningResource', '@id': `${url}#resource`, name: p.title, description: p.description, url, inLanguage: 'en', educationalLevel: p.audience, learningResourceType: 'Worked examples and practice problems', isAccessibleForFree: true, publisher: { '@id': `${SITE_URL}/#org` } },
      { '@type': 'FAQPage', '@id': `${url}#faq`, mainEntity: p.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Algegram', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Learn', item: `${SITE_URL}/learn` },
        { '@type': 'ListItem', position: 3, name: p.title, item: url },
      ] },
    ],
  }
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <nav style={{ borderBottom: '1px solid var(--border)', padding: '0 1rem' }} className='flex items-center justify-between h-14 max-w-6xl mx-auto'>
        <Link href='/' style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--accent2)', textDecoration: 'none' }}>Algegram</Link>
        <Link href={cta} style={{ background: 'var(--accent)', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600 }}>Ask a question free</Link>
      </nav>
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '2.5rem 1.25rem' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}><Link href='/learn' style={{ color: 'var(--text-dim)' }}>Learn</Link> / {p.title}</p>
        <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2.1rem)', marginBottom: '0.75rem' }}>{p.title}</h1>
        <p style={{ lineHeight: 1.75, marginBottom: '0.5rem' }}>{p.intro}</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '2rem' }}>For: {p.audience}</p>

        <h2 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.75rem' }}>The rules</h2>
        <ul style={{ ...card, lineHeight: 1.75, paddingLeft: '2.2rem', listStyle: 'disc', marginBottom: '2rem' }}>{p.rules.map((r, i) => <li key={i}>{r}</li>)}</ul>

        <h2 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.75rem' }}>Worked examples</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {p.examples.map((ex, i) => (
            <div key={i} style={card}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>Example {i + 1}: {ex.q}</h3>
              <ol style={{ color: 'var(--text-dim)', lineHeight: 1.7, paddingLeft: '1.2rem', listStyle: 'decimal', margin: '0 0 0.5rem' }}>{ex.steps.map((s, j) => <li key={j}>{s}</li>)}</ol>
              <p style={{ fontWeight: 700, margin: 0 }}>Answer: {ex.answer}</p>
            </div>
          ))}
        </div>

        <h2 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.75rem' }}>Practice problems</h2>
        <div style={{ ...card, marginBottom: '1rem' }}>
          <ol style={{ lineHeight: 1.9, paddingLeft: '1.2rem', listStyle: 'decimal', margin: 0 }}>{p.practice.map((x, i) => <li key={i}>{x.q}</li>)}</ol>
          <details style={{ marginTop: '0.75rem' }}><summary style={{ cursor: 'pointer', color: 'var(--accent2)', fontWeight: 600 }}>Show answers</summary>
            <ol style={{ lineHeight: 1.9, paddingLeft: '1.2rem', listStyle: 'decimal', marginTop: '0.5rem', color: 'var(--text-dim)' }}>{p.practice.map((x, i) => <li key={i}>{x.a}</li>)}</ol>
          </details>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
          {p.quiz.map(q => <Link key={q.href} href={q.href} style={{ background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.7rem 1.2rem', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>{q.label} →</Link>)}
        </div>

        <h2 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.75rem' }}>Frequently asked questions</h2>
        {p.faq.map((f, i) => (
          <div key={i} style={{ marginBottom: '1.1rem' }}>
            <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.3rem' }}>{f.q}</h3>
            <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, margin: 0 }}>{f.a}</p>
          </div>
        ))}

        <div style={{ ...card, textAlign: 'center', margin: '2.5rem 0 2rem' }}>
          <p style={{ marginBottom: '0.9rem', color: 'var(--text-dim)' }}>Stuck on your own problem? Type it in and Layla, Algegram&apos;s AI tutor, shows every step. Your first {GUEST_FREE_QUESTIONS} questions are free, no sign-up.</p>
          <Link href={cta} style={{ background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.75rem 1.6rem', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>Ask my math question →</Link>
        </div>

        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>Related</h2>
        <ul style={{ lineHeight: 1.9, paddingLeft: '1.2rem', listStyle: 'disc' }}>{p.related.map(r => <li key={r.href}><Link href={r.href} style={{ color: 'var(--accent2)' }}>{r.label}</Link></li>)}</ul>
      </main>
    </div>
  )
}
