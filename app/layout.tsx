import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Algegram — Get the gram on any math problem 📐',
  description: 'Get the gram on any math problem! Step-by-step AI help with fractions, algebra, geometry, calculus & more.
  openGraph: {
    title: 'Algegram — Get the gram on any math problem 📐',
    description: 'Solve any math problem instantly with AI.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
