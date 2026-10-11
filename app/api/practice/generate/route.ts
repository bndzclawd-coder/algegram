import { NextRequest, NextResponse } from 'next/server'
import { requirePro } from '@/lib/practice/gate'
import { generateQuestions } from '@/lib/practice/generate'
import { sealSet } from '@/lib/practice/token'
import { isDifficulty, isTopic, PRACTICE_COUNT, PRACTICE_DAILY_CAP, TEST_COUNT, TEST_SECONDS } from '@/lib/practice/topics'
import { PRO_FAIR_USE_DAILY } from '@/lib/site-config'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Pro only. One generation = 1 message in the daily `usage` counter (atomic increment_usage),
// plus a hard cap of PRACTICE_DAILY_CAP practice/test generations per UTC day.
export async function POST(req: NextRequest) {
  const gate = await requirePro()
  if (gate instanceof NextResponse) return gate
  const { userId, db } = gate

  const b = await req.json().catch(() => null)
  const mode = b?.mode === 'test' ? 'test' : b?.mode === 'practice' ? 'practice' : null
  if (!mode || !isTopic(b?.topic) || !isDifficulty(b?.difficulty)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  if (!sealSet({ uid: userId, topic: b.topic, mode, iat: 0, exp: 0, qs: [] })) {
    console.error('[practice] token secret missing')
    return NextResponse.json({ error: 'Practice is temporarily unavailable.' }, { status: 503 })
  }

  const today = new Date().toISOString().split('T')[0]
  const cap = await db.rpc('increment_practice_usage', { p_user_id: userId, p_day: today, p_limit: PRACTICE_DAILY_CAP })
  if (cap.error) { console.error('[practice] increment_practice_usage failed', { code: cap.error.code }); return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 503 }) }
  if (cap.data === null) return NextResponse.json({ error: `You've reached today's limit of ${PRACTICE_DAILY_CAP} practice sets and tests. Come back tomorrow.`, limit: true }, { status: 429 })
  const usage = await db.rpc('increment_usage', { p_user_id: userId, p_day: today, p_limit: PRO_FAIR_USE_DAILY })
  if (usage.error) { console.error('[practice] increment_usage failed', { code: usage.error.code }); return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 503 }) }
  if (usage.data === null) return NextResponse.json({ error: "You've reached today's fair-use limit. Come back tomorrow.", limit: true }, { status: 429 })

  const count = mode === 'test' ? TEST_COUNT : PRACTICE_COUNT
  const qs = await generateQuestions(b.topic, b.difficulty, count)
  if (!qs) return NextResponse.json({ error: 'Could not create questions right now. Please try again.' }, { status: 502 })

  const now = Date.now()
  const exp = now + (mode === 'test' ? (TEST_SECONDS + 60) * 1000 : 2 * 60 * 60 * 1000)
  const token = sealSet({ uid: userId, topic: b.topic, mode, iat: now, exp, qs: qs.map(q => ({ answer: q.answer, kind: q.kind, steps: q.steps, hint: q.hint })) })
  return NextResponse.json({
    token, mode, topic: b.topic, seconds: mode === 'test' ? TEST_SECONDS : null,
    questions: qs.map(q => q.question),
  }, { headers: { 'Cache-Control': 'no-store' } })
}
