import { pageMetadata } from '@/lib/seo'
import { LEGAL_PAGES_REVIEWED } from '@/lib/site-config'
import { LegalPendingNotice } from '@/components/LegalPendingNotice'
import { LegalPage } from '@/components/LegalMarkdown'
import { BILLING_MD } from '@/lib/legal/billing'

// Hidden behind the same legal-review flag as /privacy and /terms until the policy is approved.
export const metadata = LEGAL_PAGES_REVIEWED ? pageMetadata({
  title: 'Billing, Cancellation & Refund Policy | Algegram',
  description: 'How Algegram Pro billing, free trials, cancellation and refunds work.',
  path: '/billing',
}) : pageMetadata({ title: 'Billing Policy | Algegram', description: 'This page is being updated.', path: '/billing', noindex: true })

export default function Billing() {
  if (!LEGAL_PAGES_REVIEWED) return <LegalPendingNotice title='Billing, Cancellation & Refund Policy' />
  return <LegalPage md={BILLING_MD} />
}
