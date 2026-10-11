import type { Metadata } from 'next'
import PracticeClient from '@/app/components/PracticeClient'

export const metadata: Metadata = { title: 'Practice', robots: { index: false, follow: false } }

// Signed-in only (middleware). Pro + age checks are enforced server-side by /api/practice/*.
export default function Page() {
  return <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}><PracticeClient mode='practice' /></div>
}
