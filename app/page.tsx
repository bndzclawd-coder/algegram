'use client'
import Link from 'next/link'

const features = [
  { icon: '∫', title: 'Calculus', desc: 'Derivatives, integrals, limits, series — with full step-by-step workings.' },
  { icon: '√', title: 'Algebra', desc: 'Solve equations, factor polynomials, simplify expressions instantly.' },
  { icon: '📈', title: 'Graphing', desc: 'Visualize functions in real time. Zoom, pan, trace curves.' },
  { icon: '∑', title: 'Statistics', desc: 'Probability, distributions, hypothesis testing and data analysis.' },
  { icon: 'λ', title: 'Linear Algebra', desc: 'Matrices, eigenvalues, vector spaces, transformations.' },
  { icon: '🔢', title: 'Number Theory', desc: 'Primes, modular arithmetic, proofs and combinatorics.' },
]

export default function Landing() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid var(--border)', padding: '0 2rem' }}
        className="flex items-center justify-between h-16 max-w-6xl mx-auto">
        <span style={{ fontWeight: 800, fontSize: '1.25rem', background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Algegram
        </span>
        <div className="flex gap-6 items-center">
          <Link href="/pricing" style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Pricing</Link>
          <Link href="/auth/login" style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Sign in</Link>
          <Link href="/auth/signup"
            style={{ background: 'var(--accent)', color: '#fff', padding: '0.45rem 1.1rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600 }}>
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center max-w-4xl mx-auto px-6 pt-24 pb-16">
        <div style={{ display: 'inline-block', background: 'rgba(108,99,255,.12)', border: '1px solid rgba(108,99,255,.3)', borderRadius: '999px', padding: '0.3rem 1rem', fontSize: '0.8rem', color: 'var(--accent2)', marginBottom: '1.5rem' }}>
          ✨ Powered by GPT-4o, Claude & more
        </div>
        <h1 style={{ fontSize: 'clamp(2.5rem,6vw,4rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem' }}>
          Get the gram on any math problem, step by step.<br />
          <span style={{ background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Get the gram on any math problem. Instantly. 📐
          </span>
        </h1>
        <p style={{ fontSize: '1.15rem', color: 'var(--text-dim)', maxWidth: '580px', margin: '0 auto 2.5rem' }}>
          Step-by-step solutions with beautiful LaTeX rendering. From middle school arithmetic to university-level proofs.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/auth/signup"
            style={{ background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.85rem 2rem', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', boxShadow: '0 0 30px rgba(108,99,255,.35)' }}>
            Start solving for free →
          </Link>
          <Link href="/pricing"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.85rem 2rem', borderRadius: '12px', fontWeight: 600, fontSize: '1rem' }}>
            See pricing
          </Link>
        </div>
        <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>No credit card required · 20 messages free every day</p>
      </section>

      {/* Demo preview */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 0 60px rgba(108,99,255,.1)' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
            <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>Algegram</span>
          </div>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ alignSelf: 'flex-end', background: 'rgba(108,99,255,.2)', border: '1px solid rgba(108,99,255,.3)', borderRadius: '12px 12px 4px 12px', padding: '0.75rem 1rem', maxWidth: '70%', fontSize: '0.9rem' }}>
              Solve ∫x²·sin(x) dx using integration by parts
            </div>
            <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid var(--border)', borderRadius: '12px 12px 12px 4px', padding: '1rem', maxWidth: '85%', fontSize: '0.9rem', lineHeight: 1.7 }}>
              <div style={{ color: 'var(--accent2)', fontWeight: 600, marginBottom: '0.5rem' }}>Using integration by parts: ∫u dv = uv − ∫v du</div>
              <div>Let <strong>u = x²</strong>, <strong>dv = sin(x)dx</strong></div>
              <div>Then <strong>du = 2x dx</strong>, <strong>v = −cos(x)</strong></div>
              <div style={{ marginTop: '0.5rem', fontFamily: 'monospace', background: 'rgba(0,0,0,.3)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                = −x²cos(x) + 2∫x·cos(x) dx
              </div>
              <div style={{ marginTop: '0.5rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>Applying integration by parts again…</div>
              <div style={{ marginTop: '0.5rem', fontFamily: 'monospace', background: 'rgba(108,99,255,.08)', padding: '0.5rem 0.75rem', borderRadius: '6px', color: 'var(--accent2)' }}>
                = −x²cos(x) + 2x·sin(x) + 2cos(x) + C
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.75rem', marginBottom: '3rem' }}>Everything you need to master math</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.25rem' }}>
          {features.map(f => (
            <div key={f.title} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{f.icon}</div>
              <div style={{ fontWeight: 600, marginBottom: '0.4rem' }}>{f.title}</div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.875rem', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ borderTop: '1px solid var(--border)', padding: '5rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontWeight: 800, fontSize: '2rem', marginBottom: '1rem' }}>Ready to solve smarter?</h2>
        <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>Join thousands of students and professionals using Algegram.</p>
        <Link href="/auth/signup"
          style={{ background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.85rem 2.5rem', borderRadius: '12px', fontWeight: 700, fontSize: '1rem' }}>
          Get started — it's free →
        </Link>
      </section>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
        © {new Date().getFullYear()} Algegram · <Link href="/pricing" style={{ color: 'var(--text-dim)' }}>Pricing</Link> · Built with ❤️ and AI
      </footer>
    </div>
  )
}
