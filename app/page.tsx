import { WHAT_IS_ALGEGRAM } from '@/lib/about'
import LaylaHome from '@/app/components/home/LaylaHome'
import type { Example } from '@/components/WorkedExample'
import { JsonLd } from '@/components/JsonLd'
import { pageMetadata } from '@/lib/seo'
import { SITE_URL, MAILBOX_LIVE, GUEST_FREE_QUESTIONS } from '@/lib/site-config'

export const metadata = pageMetadata({
  title: 'Algegram – AI Math Tutor with Step-by-Step Answers',
  description: `Type any math problem and see every step explained, from fractions to calculus. ${GUEST_FREE_QUESTIONS} free questions with no sign-up.`,
  path: '/',
})

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#org`,
      name: 'Algegram',
      url: SITE_URL,
      logo: `${SITE_URL}/icon.png`,
      ...(MAILBOX_LIVE ? { email: 'hello@algegram.xyz' } : {}),
      ...(MAILBOX_LIVE ? { contactPoint: { '@type': 'ContactPoint', email: 'support@algegram.xyz', contactType: 'customer support' } } : {}),
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'Algegram',
      publisher: { '@id': `${SITE_URL}/#org` },
    },
    {
      '@type': ['WebApplication', 'EducationalApplication'],
      '@id': `${SITE_URL}/#app`,
      name: 'Algegram',
      url: SITE_URL,
      description: WHAT_IS_ALGEGRAM,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web browser',
      educationalUse: 'Homework help, practice',
      audience: { '@type': 'EducationalAudience', educationalRole: 'student' },
      isAccessibleForFree: true,
      offers: [
        { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
        { '@type': 'Offer', name: 'Pro', price: '12.99', priceCurrency: 'USD', description: 'Monthly subscription with a 7-day free trial' },
      ],
      publisher: { '@id': `${SITE_URL}/#org` },
    },
  ],
}

const example: Example = {
  id: 'example',
  title: 'See how it works: a worked example',
  problem: 'Solve 2x + 5 = 17',
  steps: [
    { math: '2x + 5 − 5 = 17 − 5', why: 'Subtract 5 from both sides to get the x-term by itself.' },
    { math: '2x = 12', why: 'Simplify both sides.' },
    { math: '2x ÷ 2 = 12 ÷ 2', why: 'Divide both sides by 2, the number multiplying x.' },
    { math: 'x = 6', why: 'Simplify.' },
  ],
  answer: 'x = 6',
  check: '2(6) + 5 = 12 + 5 = 17 ✓',
}

// Only link pages that exist and are ready. /ai-math-tutor-for-kids is held back until
// parental consent + privacy features it describes are confirmed live.
const TOPICS = [
  { href: '/fraction-calculator', icon: '½', title: 'Fractions', body: 'Add, subtract, multiply and divide fractions, with every step shown.' },
  { href: '/quadratic-equation-solver', icon: 'x²', title: 'Quadratic equations', body: 'Factoring, the quadratic formula and completing the square.' },
  { href: '/solve/algebra', icon: '√', title: 'Algebra', body: 'Solve equations, factor polynomials, simplify expressions.' },
  { href: '/solve/calculus', icon: '∫', title: 'Calculus', body: 'Derivatives, integrals, limits and series, with full workings.' },
  { href: '/solve/statistics', icon: '∑', title: 'Statistics', body: 'Probability, distributions, hypothesis testing.' },
  { href: '/solve/linear-algebra', icon: 'λ', title: 'Linear algebra', body: 'Matrices, eigenvalues, vector spaces.' },
]

// Static: served from the CDN with no serverless cold start. The Supabase ?code= fallback
// redirect lives in middleware.ts (it made this page dynamic before).
export const dynamic = 'force-static'
export const revalidate = 3600

export default function Home() {

  return (
    <>
      <JsonLd data={JSON_LD} />
      <LaylaHome example={example} topics={TOPICS} />
    </>
  )
}
