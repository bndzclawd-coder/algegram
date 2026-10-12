import { NextResponse } from 'next/server'
import { requirePro } from '@/lib/practice/gate'
import { weakSpots } from '@/lib/practice/weakspots'

export const dynamic = 'force-dynamic'

// Pro only. Reads the user's own topic scores from the last 30 days. Nothing is written.
export async function GET() {
  const gate = await requirePro()
  if (gate instanceof NextResponse) return gate
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await gate.db.from('practice_results')
    .select('topic, score, total, created_at').eq('user_id', gate.userId).gte('created_at', since).limit(1000)
  if (error) { console.error('[weak-spots] read failed', { code: error.code }); return NextResponse.json({ error: 'Something went wrong.' }, { status: 503 }) }
  return NextResponse.json({ spots: weakSpots(data ?? []) }, { headers: { 'Cache-Control': 'no-store' } })
}
