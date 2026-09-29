import Link from 'next/link'
import type { Metadata } from 'next'

// Static list of supported topics and example Q&A pairs
// Never render user input on these pages — SEO-safe static content only
const TOPIC_DATA: Record<string, {
  title: string
  description: string
  examples: { question: string; answer: string }[]
}> = {
  algebra: {
    title: 'Algebra',
    description: 'Solve linear and quadratic equations, simplify expressions, and factor polynomials.',
    examples: [
      {
        question: 'Solve 2x + 4 = 10',
        answer: 'Subtract 4 from both sides: 2x = 6. Divide by 2: x = 3.',
      },
      {
        question: 'Factor x² + 5x + 6',
        answer: 'Find two numbers that multiply to 6 and add to 5: (x + 2)(x + 3).',
      },
      {
        question: 'Simplify 3(x + 4) − 2x',
        answer: 'Distribute: 3x + 12 − 2x = x + 12.',
      },
    ],
  },
  calculus: {
    title: 'Calculus',
    description: 'Derivatives, integrals, limits, and series — with step-by-step workings.',
    examples: [
      {
        question: 'Find the derivative of x²',
        answer: 'Using the power rule: d/dx(x²) = 2x.',
      },
      {
        question: 'Evaluate ∫ 2x dx',
        answer: 'Integrate term by term: x² + C, where C is the constant of integration.',
      },
      {
        question: 'Find lim(x→0) sin(x)/x',
        answer: 'By L\'Hôpital\'s rule or the standard limit: lim = 1.',
      },
    ],
  },
  fractions: {
    title: 'Fractions',
    description: 'Add, subtract, multiply, and simplify fractions step by step.',
    examples: [
      {
        question: 'Simplify 3/4 + 1/2',
        answer: 'Convert to common denominator: 3/4 + 2/4 = 5/4 = 1¼.',
      },
      {
        question: 'Multiply 2/3 × 3/5',
        answer: 'Multiply numerators and denominators: 6/15 = 2/5.',
      },
    ],
  },
  statistics: {
    title: 'Statistics',
    description: 'Mean, median, standard deviation, probability, and hypothesis testing.',
    examples: [
      {
        question: 'Find the mean of 4, 7, 9, 2, 8',
        answer: 'Sum = 30, count = 5. Mean = 30 ÷ 5 = 6.',
      },
      {
        question: 'What is the probability of rolling a 6 on a fair die?',
        answer: 'There is 1 favorable outcome out of 6 possible outcomes: P = 1/6 ≈ 16.7%.',
      },
    ],
  },
  'linear-algebra': {
    title: 'Linear Algebra',
    description: 'Matrix operations, eigenvalues, vector spaces, and linear transformations.',
    examples: [
      {
        question: 'What is the determinant of [[1,2],[3,4]]?',
        answer: 'det = (1)(4) − (2)(3) = 4 − 6 = −2.',
      },
    ],
  },
  'number-theory': {
    title: 'Number Theory',
    description: 'Prime numbers, modular arithmetic, GCD, and combinatorics.',
    examples: [
      {
        question: 'Find GCD(48, 18)',
        answer: 'Using Euclidean algorithm: 48 = 2×18 + 12; 18 = 1×12 + 6; 12 = 2×6 + 0. GCD = 6.',
      },
    ],
  },
}

export async function generateStaticParams() {
  return Object.keys(TOPIC_DATA).map(topic => ({ topic }))
}

export async function generateMetadata({ params }: { params: { topic: string } }): Promise<Metadata> {
  const data = TOPIC_DATA[params.topic]
  if (!data) return { title: 'Math Help — Algegram' }
  return {
    title: `${data.title} Help — Algegram`,
    description: `${data.description} See example problems and solutions. Ask your own question free.`,
    alternates: { canonical: `https://www.algegram.xyz/solve/${params.topic}` },
  }
}

export default function SolveTopic({ params }: { params: { topic: string } }) {
  const data = TOPIC_DATA[params.topic]

  if (!data) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontWeight: 700, marginBottom: '1rem' }}>Topic not found</h1>
          <Link href="/" style={{ color: 'var(--accent2)' }}>Back to Algegram →</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <nav style={{ borderBottom: '1px solid var(--border)', padding: '0 1rem' }}
        className="flex items-center justify-between h-14 max-w-6xl mx-auto">
        <Link href="/" style={{ fontWeight: 800, fontSize: '1.2rem', background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>
          Algegram
        </Link>
        <Link href="/auth/signup" style={{ background: 'var(--accent)', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
          Get started free
        </Link>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ marginBottom: '0.75rem' }}>
          <Link href="/" style={{ color: 'var(--text-dim)', fontSize: '0.875rem', textDecoration: 'none' }}>← All topics</Link>
        </div>
        <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0.75rem' }}>{data.title} Help</h1>
        <p style={{ color: 'var(--text-dim)', marginBottom: '2rem', lineHeight: 1.7 }}>{data.description}</p>

        {/* CTA banner */}
        <div style={{ background: 'rgba(108,99,255,.1)', border: '1px solid rgba(108,99,255,.3)', borderRadius: '12px', padding: '1.25rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Ask your own {data.title.toLowerCase()} question</div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>This is an example page. Get AI step-by-step help for your specific problem.</div>
          </div>
          <Link href="/#chat" style={{ background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.65rem 1.25rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Try it free →
          </Link>
        </div>

        <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-dim)' }}>Example problems &amp; solutions</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {data.examples.map((ex, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(108,99,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>Q</div>
                <p style={{ fontWeight: 600, lineHeight: 1.6, margin: 0 }}>{ex.question}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(52,211,153,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--green)', flexShrink: 0 }}>A</div>
                <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, margin: 0 }}>{ex.answer}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '3rem', textAlign: 'center', padding: '2rem', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-dim)', marginBottom: '1rem' }}>
            These are just examples. For your specific problem, ask Algegram — it's free to start.
          </p>
          <Link href="/#chat" style={{ background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.8rem 2rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none' }}>
            Ask my math question →
          </Link>
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
