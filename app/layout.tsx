import type { Metadata } from 'next'
import './globals.css'
import 'katex/dist/katex.min.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.algegram.xyz'),
  title: {
    default: 'Algegram — AI Math Tutor',
    template: '%s | Algegram',
  },
  description:
    'Step-by-step AI math help for algebra, calculus, and more. Free to start.',
  openGraph: {
    title: 'Algegram — AI Math Tutor',
    description: 'Step-by-step AI math help for algebra, calculus, and more. Free to start.',
    type: 'website',
    url: 'https://www.algegram.xyz',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Algegram — AI Math Tutor',
    description: 'Step-by-step AI math help for algebra, calculus, and more. Free to start.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: 'https://www.algegram.xyz' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
