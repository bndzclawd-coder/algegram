import { NextRequest, NextResponse } from 'next/server'
import { requirePro } from '@/lib/practice/gate'
import { openSet } from '@/lib/practice/token'
import { checkAnswer } from '@/lib/practice/equivalence'

export const dynamic = 'force-dynamic'

// Practice mode: check one answer. Returns the step solution, plus a hint when wrong. Nothing stored.
export async function POST(req: NextRequest) {
  const gate = await requirePro()
  if (gate instanceof NextResponse) return gate
  const b = await req.json().catch(() => null)
  const set = openSet(b?.token, gate.userId)
  if (!set || set.mode !== 'practice') return NextResponse.json({ error: 'This practice set has expired. Start a new one.' }, { status: 410 })
  const i = Number(b?.index)
  const q = Number.isInteger(i) ? set.qs[i] : undefined
  if (!q || typeof b?.answer !== 'string' || b.answer.length > 200) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  const correct = checkAnswer(b.answer, q.answer, q.kind)
  return NextResponse.json({ correct, answer: q.answer, steps: q.steps, hint: correct ? null : q.hint }, { headers: { 'Cache-Control': 'no-store' } })
}
