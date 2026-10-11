import Link from 'next/link'

export function LegalPendingNotice({ title }: { title: string }) {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <Link href="/" style={{ fontWeight: 800, color: 'var(--accent2)', textDecoration: 'none' }}>Algegram</Link>
        <h1 style={{ fontWeight: 800, fontSize: '1.75rem', margin: '1.5rem 0 1rem' }}>{title}</h1>
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.8 }}>
          This page is being updated. Questions: we&apos;ll post contact details soon.
        </p>
      </div>
    </div>
  )
}
