import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Pricing — Algegram',
  description: 'Start free, upgrade to Pro for unlimited AI math tutoring. 7-day free trial. Cancel anytime.',
  alternates: { canonical: 'https://www.algegram.xyz/pricing' },
}

export default function PricingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
