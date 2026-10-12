import { pageMetadata } from '@/lib/seo'
import { LEGAL_PAGES_REVIEWED } from '@/lib/site-config'
import { LegalPage } from '@/components/LegalMarkdown'
import { TERMS_MD } from '@/lib/legal/terms'
import { LegalPendingNotice } from '@/components/LegalPendingNotice'

export const metadata = LEGAL_PAGES_REVIEWED ? pageMetadata({
  title: 'Terms of Service | Algegram',
  description: 'Algegram Terms of Service: plans, billing and refunds, parent consent for under-13 users, and fair use.',
  path: '/terms',
}) : pageMetadata({ title: 'Terms of Service | Algegram', description: 'This page is being updated.', path: '/terms', noindex: true })

export default function Terms() {
  if (!LEGAL_PAGES_REVIEWED) return <LegalPendingNotice title='Terms of Service' />
  return <LegalPage md={TERMS_MD} />
}
