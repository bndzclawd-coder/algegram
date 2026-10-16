import Link from 'next/link'
import { pageMetadata } from '@/lib/seo'
import { SITE_URL } from '@/lib/site-config'

export const metadata = pageMetadata({
  title: 'AI Math Tutor for Kids Under 13 (a MathGPT Alternative for Kids) | Algegram',
  description: 'Looking for an AI math tutor your under-13 child is allowed to use? Algegram works with a parent’s approval. See what MathGPT sites’ own terms say about under-13 users.',
  path: '/ai-math-tutor-for-kids-under-13',
})

// Quotes fetched Oct 15, 2026 from the linked pages. No quality claims or prices for other services.
const FAQ = [
  { q: 'Can my child under 13 use Algegram?', a: 'Yes, with a parent’s approval. When a child under 13 signs up, we email the parent one link. The parent approves and sets the child’s password. Nothing starts until they do.' },
  { q: 'Can kids under 13 use MathGPT?', a: 'Both sites named MathGPT that we checked say no in their own policies. math-gpt.org says children under 13 may not use the service, and mathgpt.ai says users under 13 are not permitted.' },
  { q: 'Is Algegram free?', a: 'Yes, it’s free to start. Pro is $12.99 a month, and new subscribers start with a 7-day free trial.' },
]

export default function Page() {
  const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', url: `${SITE_URL}/ai-math-tutor-for-kids-under-13`, mainEntity: FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }
  const h2 = { fontWeight: 700, fontSize: '1.2rem', margin: '2rem 0 0.6rem' }
  const quote = { borderLeft: '3px solid var(--accent)', padding: '0.4rem 0 0.4rem 1rem', margin: '0.6rem 0', color: 'var(--text-dim)', lineHeight: 1.7 }
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', maxWidth: 760, margin: '0 auto', padding: '2.5rem 1.25rem', lineHeight: 1.75 }}>
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <p><Link href='/' style={{ color: 'var(--accent2)', fontWeight: 800 }}>Algegram</Link></p>
      <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2.1rem)', margin: '1rem 0' }}>An AI math tutor for kids under 13</h1>
      <p>Many AI homework tools aren’t open to children under 13. If you’re a parent looking for a MathGPT alternative your younger child is allowed to use, here’s what the MathGPT sites’ own policies say, and how Algegram handles kids.</p>

      <h2 style={h2}>What MathGPT sites say about under-13 users</h2>
      <p>The <a href='https://math-gpt.org/privacy' rel='nofollow noopener' style={{ color: 'var(--accent2)' }}>math-gpt.org privacy policy</a> says:</p>
      <blockquote style={quote}>“The Service is not intended for children under 13, and children under 13 may not use the Service or submit personal information to MathGPT.”</blockquote>
      <p>The <a href='https://mathgpt.ai/terms' rel='nofollow noopener' style={{ color: 'var(--accent2)' }}>mathgpt.ai terms of use</a> say:</p>
      <blockquote style={quote}>“If you are under 13 years old, you are not permitted to use the Got It! Inc.’s AI products and services (e.g., “MathGPT”, “MathGPT Account”, etc.)… If you are 13 years of age or older, but not of legal age to form a binding contract (in many places, this is 18 years old), then you must get your parent or guardian to read these Terms and agree to them for you, before you use the Service or provide any information to us.”</blockquote>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Quotes taken from those pages on October 15, 2026. Policies can change, so check the linked pages for the current wording.</p>

      <h2 style={h2}>How Algegram works for kids under 13</h2>
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
      <p style={{ marginTop: '2rem' }}><Link href='/auth/signup?utm_source=seo&utm_medium=organic&utm_campaign=kids_under_13' style={{ background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>Sign up with a parent →</Link></p>
    </main>
  )
}
