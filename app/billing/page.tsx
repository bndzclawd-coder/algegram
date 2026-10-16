import { pageMetadata } from '@/lib/seo'
import { LegalPage } from '@/components/LegalMarkdown'
import { BILLING_MD } from '@/lib/legal/billing'

// Published Oct 15 2026 (owner-approved). /terms stays behind the legal-review notice.
export const metadata = pageMetadata({
  title: 'Billing, Cancellation & Refund Policy | Algegram',
  description: 'How Algegram Pro billing, free trials, cancellation and refunds work.',
  path: '/billing',
})

export default function Billing() {
  return <LegalPage md={BILLING_MD} />
}
