import Link from 'next/link'
import { pageMetadata } from '@/lib/seo'
import { SITE_URL } from '@/lib/site-config'
import { HELP_FAQ } from '@/lib/help'

export const metadata = pageMetadata({
  title: 'Help and FAQ | Algegram',
  description: 'Answers about Algegram: free questions and plans, Pro and cancelling, safety for kids and parent approval, and how to get help.',
  path: '/help',
})

const linkify = (t: string) => t.split(/(\S+@algegram\.xyz)/).map((p, i) => /@algegram\.xyz$/.test(p) ? <a key={i} href={`mailto:${p}`} style={{ color: 'var(--accent2)' }}>{p}</a> : p)

export default function Help() {
  const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', url: `${SITE_URL}/help`, mainEntity: HELP_FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', maxWidth: 760, margin: '0 auto', padding: '2.5rem 1.25rem' }}>
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <p><Link href='/' style={{ color: 'var(--accent2)', fontWeight: 800 }}>Algegram</Link></p>
      <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2rem)', margin: '1rem 0 1.5rem' }}>Help and FAQ</h1>
      {HELP_FAQ.map((f, i) => (
        <section key={i} style={{ marginBottom: '1.4rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.35rem' }}>{f.q}</h2>
          <p style={{ color: 'var(--text-dim)', lineHeight: 1.75, margin: 0 }}>{linkify(f.a)}</p>
        </section>
      ))}
      <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
        More detail: <Link href='/billing' style={{ color: 'var(--accent2)' }}>Billing and refunds</Link> · <Link href='/privacy' style={{ color: 'var(--accent2)' }}>Privacy</Link> · <Link href='/learn' style={{ color: 'var(--accent2)' }}>Free practice</Link>
      </p>
    </main>
  )
}
