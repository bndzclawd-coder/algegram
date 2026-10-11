import { NextRequest, NextResponse } from 'next/server'
import { requirePro } from '@/lib/practice/gate'
import { openSet } from '@/lib/practice/token'
import { checkAnswer } from '@/lib/practice/equivalence'

export const dynamic = 'force-dynamic'

// Grades a whole set server-side and stores ONLY topic tag + score + total (no questions or answers).
export async function POST(req: NextRequest) {
  const gate = await requirePro()
  if (gate instanceof NextResponse) return gate
  const b = await req.json().catch(() => null)
  const set = openSet(b?.token, gate.userId)
  if (!set) return NextResponse.json({ error: 'This set has expired. Start a new one.' }, { status: 410 })
  const answers: unknown[] = Array.isArray(b?.answers) ? b.answers.slice(0, set.qs.length) : []
  const review = set.qs.map((q, i) => {
    const a = typeof answers[i] === 'string' ? (answers[i] as string).slice(0, 200) : ''
    return { correct: a !== '' && checkAnswer(a, q.answer, q.kind), answer: q.answer, steps: q.steps, hint: q.hint }
  })
  const score = review.filter(r => r.correct).length
  const { error } = await gate.db.from('practice_results').insert({ user_id: gate.userId, topic: set.topic, score, total: set.qs.length })
  if (error) console.error('[practice] result insert failed', { code: error.code })
  return NextResponse.json({ score, total: set.qs.length, review, saved: !error }, { headers: { 'Cache-Control': 'no-store' } })
}
