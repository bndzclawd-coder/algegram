import Link from 'next/link'
import ConsentContent from './ConsentClient'
import { verifyConsentToken } from '@/lib/account/consent-verify'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const metadata = { robots: { index: false, follow: false } }

export default async function ConsentPage({ searchParams }: { searchParams: { token?: string; action?: string } }) {
  const sp = searchParams
  const token = typeof sp.token === 'string' ? sp.token : null
  const action = typeof sp.action === 'string' ? sp.action : null
  // Read-only server check (signature, expiry, used-token record). Never writes on GET.
  const initial = await verifyConsentToken(token)
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', padding: '3rem 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: '1.4rem', background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>
          Algegram
        </Link>
      </div>
      <ConsentContent token={token} action={action} initial={initial} />
    </div>
  )
}
