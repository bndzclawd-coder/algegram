import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { QUIZZES } from '@/lib/quiz/data'
import { consume } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// Signed-in users only: stores topic + score + total (no questions, answers or names). Guests are never saved.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ saved: false }, { status: 401 })
  const b = await req.json().catch(() => null)
  const topic = typeof b?.topic === 'string' ? b.topic : ''
  const quiz = QUIZZES[topic]
  const total = quiz?.questions.length ?? 0
  const score = Number(b?.score)
  if (!quiz || !Number.isInteger(score) || score < 0 || score > total) return NextResponse.json({ error: 'Invalid result.' }, { status: 400 })
  const rl = await consume('quiz-result', user.id, 50, 24 * 60 * 60)
  if (rl !== 'ok') return NextResponse.json({ saved: false }, { status: 429 })
  const { error } = await createServiceClient().from('practice_results').insert({ user_id: user.id, topic, score, total, source: 'quiz' })
  if (error) console.error('[quiz] result insert failed', { code: error.code })
  return NextResponse.json({ saved: !error }, { headers: { 'Cache-Control': 'no-store' } })
}
