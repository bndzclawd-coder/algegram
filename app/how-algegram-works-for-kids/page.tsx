import Link from 'next/link'
import { pageMetadata } from '@/lib/seo'
import { SITE_URL } from '@/lib/site-config'

export const metadata = pageMetadata({
  title: 'How Algegram Works for Kids Under 13 | Algegram',
  description: 'How Algegram works for kids under 13: every step shown, a parent approves first, little personal data, no ads. Free to start.',
  path: '/how-algegram-works-for-kids',
})

const FAQ = [
  { q: 'Can my child under 13 use Algegram?', a: 'Yes, with a parent’s approval. When a child under 13 signs up, we email the parent one link. The parent approves and sets the child’s password. Nothing starts until they do.' },
  { q: 'Is Algegram free?', a: 'Yes, it’s free to start. Pro is $12.99 a month, and new subscribers start with a 7-day free trial.' },
]

export default function Page() {
  const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', url: `${SITE_URL}/how-algegram-works-for-kids`, mainEntity: FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }
  const h2 = { fontWeight: 700, fontSize: '1.2rem', margin: '2rem 0 0.6rem' }
    return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', maxWidth: 760, margin: '0 auto', padding: '2.5rem 1.25rem', lineHeight: 1.75 }}>
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <p><Link href='/' style={{ color: 'var(--accent2)', fontWeight: 800 }}>Algegram</Link></p>
      <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2.1rem)', margin: '1rem 0' }}>How Algegram works for kids under 13</h1>
      <p>Kids learn math best when they see every step and understand why it works. Algegram shows each step, and children under 13 can use it with a parent’s approval. Here’s how it works for younger kids.</p>

      <h2 style={h2}>What parents should know</h2>
      <ul style={{ paddingLeft: '1.2rem', listStyle: 'disc' }}>
        <li><strong>A parent approves first.</strong> When a child under 13 signs up, we email the parent one link. The parent approves and sets the child’s password. Nothing starts until they do.</li>
        <li><strong>Little personal data.</strong> We don’t ask for a child’s name, school, or location. For kids under 13 we don’t save their math questions, and photos of math problems aren’t saved.</li>
        <li><strong>No ads, no selling data.</strong> Parents can ask us to delete their child’s account and data anytime by emailing support@algegram.xyz.</li>
        <li><strong>Learning, not just answers.</strong> Layla, Algegram’s AI tutor, shows each step and explains why it works, so students learn the method, not just the answer.</li>
        <li><strong>Free to start.</strong> Pro is $12.99 a month, and new subscribers start with a 7-day free trial.</li>
      </ul>
      <p style={{ fontSize: '0.9rem' }}>Read the full <Link href='/privacy' style={{ color: 'var(--accent2)' }}>privacy policy</Link>.</p>

      <h2 style={h2}>Try a free quiz together</h2>
      <p>No account needed: <Link href='/quiz/fractions' style={{ color: 'var(--accent2)' }}>fractions</Link> · <Link href='/quiz/order-of-operations' style={{ color: 'var(--accent2)' }}>order of operations</Link> · <Link href='/quiz/percentages' style={{ color: 'var(--accent2)' }}>percentages</Link> · <Link href='/quiz/word-problems' style={{ color: 'var(--accent2)' }}>word problems</Link> · <Link href='/quiz/linear-equations' style={{ color: 'var(--accent2)' }}>equations</Link>. More practice: <Link href='/learn' style={{ color: 'var(--accent2)' }}>free practice pages</Link>.</p>

      <h2 style={h2}>Questions</h2>
      {FAQ.map((f, i) => <div key={i} style={{ marginBottom: '1rem' }}><h3 style={{ fontWeight: 600, fontSize: '1rem' }}>{f.q}</h3><p style={{ color: 'var(--text-dim)', margin: 0 }}>{f.a}</p></div>)}
      <p>More answers on our <Link href='/help' style={{ color: 'var(--accent2)' }}>help page</Link>.</p>
      <p style={{ marginTop: '2rem' }}><Link prefetch={false} href='/auth/signup?utm_source=seo&utm_medium=organic&utm_campaign=kids_under_13' style={{ background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>Sign up with a parent →</Link></p>
    </main>
  )
}
