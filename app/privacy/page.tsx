import { pageMetadata } from '@/lib/seo'
import { LegalPage } from '@/components/LegalMarkdown'
import { PRIVACY_MD } from '@/lib/legal/privacy'

// Published (owner-approved Oct 15 2026): always shows the full policy; /terms and /billing still use the notice.
export const metadata = pageMetadata({
  title: 'Privacy Policy | Algegram',
  description: 'Algegram Privacy Policy. What Algegram collects, why, how long we keep it, and how parents and users can delete it.',
  path: '/privacy',
})

export default function Privacy() {
  return <PrivacyFull />
}

function PrivacyFull() {
  return <LegalPage md={PRIVACY_MD} />
}
