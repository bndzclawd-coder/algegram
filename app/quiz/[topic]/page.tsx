import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { QUIZZES } from '@/lib/quiz/data'
import { pageMetadata } from '@/lib/seo'
import QuizClient from './QuizClient'

export const dynamicParams = false
export function generateStaticParams() { return Object.keys(QUIZZES).map(topic => ({ topic })) }

export function generateMetadata({ params }: { params: { topic: string } }): Metadata {
  const z = QUIZZES[params.topic]
  if (!z) return { robots: { index: false } }
  return pageMetadata({ title: `Free ${z.title} Quiz (5 Questions) | Algegram`, description: `${z.description} Free 5-question quiz with instant answers. No sign-up needed.`, path: `/quiz/${params.topic}` })
}

export default function QuizPage({ params }: { params: { topic: string } }) {
  const z = QUIZZES[params.topic]
  if (!z) notFound()
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <nav style={{ maxWidth: 720, margin: '0 auto', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href='/' style={{ fontWeight: 800, color: 'var(--text)', textDecoration: 'none' }}>alge<b style={{ color: 'var(--accent2)' }}>gram</b></Link>
        <Link href='/auth/login' style={{ color: 'var(--text)', fontSize: '0.9rem' }}>Sign in</Link>
      </nav>
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '0.5rem 1.25rem 3rem' }}>
        <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.4rem,4vw,2rem)', marginBottom: '0.4rem' }}>Free {z.title} quiz</h1>
        <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem' }}>{z.description} 5 questions, free, no sign-up.</p>
        <QuizClient topic={params.topic} questions={z.questions} />
        <p style={{ marginTop: '2rem', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
          More quizzes: {Object.entries(QUIZZES).filter(([k]) => k !== params.topic).map(([k, v], i) => <span key={k}>{i ? ' · ' : ''}<Link href={`/quiz/${k}`} style={{ color: 'var(--accent2)' }}>{v.title}</Link></span>)}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>Layla is an AI tutor, not a real person.</p>
      </main>
    </div>
  )
}
