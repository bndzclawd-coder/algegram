import Link from 'next/link'
import { MAILBOX_LIVE } from '@/lib/site-config'

/** privacy@ stays hidden until the mailbox receives mail (NEXT_PUBLIC_MAILBOX_LIVE=true). */
export function PrivacyContact() {
  return MAILBOX_LIVE
    ? <a href="mailto:privacy@algegram.xyz" style={{ color: 'var(--accent2)' }}>privacy@algegram.xyz</a>
    : <Link href="/contact" style={{ color: 'var(--accent2)' }}>our contact page</Link>
}
