export const metadata = { robots: { index: false, follow: false }, title: 'Center Starter | Algegram' }
export default function Done({ searchParams }: { searchParams: { status?: string } }) {
  const ok = searchParams.status === 'ok'
  return (
    <main style={{ maxWidth: 520, margin: '4rem auto', padding: '1.5rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.5rem' }}>{ok ? 'Thank you! Your center is on Center Starter.' : 'Checkout was canceled.'}</h1>
      <p style={{ color: 'var(--text-dim)' }}>{ok ? 'Your students\u2019 seats stay on Pro. Questions? Email support@algegram.xyz.' : 'No charge was made. You can use your center\u2019s pay link again any time.'}</p>
    </main>
  )
}
