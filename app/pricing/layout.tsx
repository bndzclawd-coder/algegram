import type { ReactNode } from 'react'
import { pageMetadata } from '@/lib/seo'

// Offer wording (trial vs $1 first month) is not decided, so the description stays generic.
export const metadata = pageMetadata({
  title: 'Pricing: Free and Pro Plans | Algegram',
  description: 'Start free with 20 questions a day, or go Pro for more step-by-step math help every day. Cancel anytime.',
  path: '/pricing',
})

export default function PricingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
