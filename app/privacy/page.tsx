import { pageMetadata } from '@/lib/seo'
import { LEGAL_PAGES_REVIEWED } from '@/lib/site-config'
import { LegalPage } from '@/components/LegalMarkdown'
import { PRIVACY_MD } from '@/lib/legal/privacy'
import { LegalPendingNotice } from '@/components/LegalPendingNotice'

export const metadata = LEGAL_PAGES_REVIEWED ? pageMetadata({
  title: 'Privacy Policy | Algegram',
  description: 'Algegram Privacy Policy. What Algegram collects, why, how long we keep it, and how parents and users can delete it.',
  path: '/privacy',
}) : pageMetadata({ title: 'Privacy Policy | Algegram', description: 'This page is being updated.', path: '/privacy', noindex: true })

export default function Privacy() {
  if (!LEGAL_PAGES_REVIEWED) return <LegalPendingNotice title='Privacy Policy' />
  return <PrivacyFull />
}

function PrivacyFull() {
  return <LegalPage md={PRIVACY_MD} />
}
