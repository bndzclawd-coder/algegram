import type { Metadata } from 'next'
import './globals.css'
import 'katex/dist/katex.min.css'
import KaTeXRenderer from '@/app/components/KaTeXRenderer'
import { SITE_URL, SITE_NAME } from '@/lib/site-config'

// Site-wide defaults. Every indexable page sets its own title/description/canonical via
// lib/seo.ts pageMetadata(); no canonical here, so pages never inherit the homepage canonical.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: 'Algegram — AI Math Tutor',
    template: '%s | Algegram',
  },
  description: 'Step-by-step AI math help for algebra, calculus, and more. Free to start.',
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <KaTeXRenderer />
        {children}
      </body>
    </html>
  )
}
