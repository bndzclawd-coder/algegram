import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Algegram Pro for your child', robots: { index: false, follow: false } }

const COPY: Record<string, [string, string]> = {
  ok: ['Thanks! Pro is on its way', 'Your child’s account will show Pro within a minute. You can manage or cancel anytime from the link in your Stripe receipt, or by emailing support@algegram.xyz.'],
  already: ['Pro is already active', 'This account already has Pro. Nothing else to do.'],
  expired: ['This link has expired', 'Ask your child to tap “Ask a parent about Pro” again and we’ll email you a fresh link.'],
  error: ['Something went wrong', 'Please try the link again in a minute, or email support@algegram.xyz.'],
}

export default function Done({ searchParams }: { searchParams: { status?: string } }) {
  const [h, p] = COPY[searchParams.status ?? 'ok'] ?? COPY.ok
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: 440, textAlign: 'center' }}>
        <h1 style={{ fontWeight: 700, fontSize: '1.4rem', marginBottom: '0.75rem' }}>{h}</h1>
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: '1.5rem' }}>{p}</p>
        <Link href='/' style={{ color: 'var(--accent2)' }}>Back to Algegram</Link>
      </div>
    </div>
  )
}
