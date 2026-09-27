import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Algegram - AI Math Tutor for Kids & Students',
  description: 'Get the gram on any math problem! Step-by-step AI help with fractions, algebra, geometry, calculus and more.',
  openGraph: {
    title: 'Algegram - AI Math Tutor for Kids & Students',
    description: 'Solve any math problem instantly with AI. Step-by-step solutions for students of all ages.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" /><script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
