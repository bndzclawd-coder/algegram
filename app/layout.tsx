import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
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

// next/font downloads these at build time and serves them from our own domain (no Google requests at runtime).
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], display: 'swap', variable: '--font-inter' })
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], display: 'swap', variable: '--font-mono' })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="antialiased">
        <KaTeXRenderer />
        {children}
      </body>
    </html>
  )
}
