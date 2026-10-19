import Link from 'next/link'
import { TRY_OWN_HREF, TRY_OWN_LABEL, TRY_OWN_LINE } from '@/lib/solve-cta'

/** Inline call to action right after the worked solution and its check. */
export default function TryOwnCta() {
  return (
    <div id='try-own' data-testid='try-own-cta' style={{ marginTop: '1.5rem', textAlign: 'center', padding: '1.5rem 1rem', background: 'rgba(108,99,255,.12)', border: '1px solid rgba(108,99,255,.4)', borderRadius: '16px' }}>
      <Link href={TRY_OWN_HREF} data-testid='try-own-button' style={{ display: 'inline-block', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.95rem 2rem', borderRadius: '12px', fontWeight: 800, fontSize: '1.05rem', textDecoration: 'none', minHeight: 48 }}>
        {TRY_OWN_LABEL} →
      </Link>
      <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', margin: '0.75rem 0 0' }}>{TRY_OWN_LINE}</p>
    </div>
  )
}
