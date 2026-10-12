import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { resolvePro } from '@/lib/account/pro'

export const dynamic = 'force-dynamic'

async function who() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET() {
  const user = await who()
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  const db = createServiceClient()
  const [{ data, error }, { isPro }] = await Promise.all([
    db.from('report_prefs').select('weekly_report').eq('user_id', user.id).maybeSingle(),
    resolvePro(db, user.id),
  ])
  if (error) return NextResponse.json({ available: false, enabled: false, pro: isPro })
  return NextResponse.json({ available: true, enabled: !!data?.weekly_report, pro: isPro })
}

export async function POST(req: NextRequest) {
  const user = await who()
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  const b = await req.json().catch(() => null)
  if (typeof b?.enabled !== 'boolean') return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  const db = createServiceClient()
  if (b.enabled) {
    const { isPro } = await resolvePro(db, user.id)
    if (!isPro) return NextResponse.json({ error: 'Weekly reports are part of Pro.', upgrade: true }, { status: 402 })
  }
  const { error } = await db.from('report_prefs')
    .upsert({ user_id: user.id, weekly_report: b.enabled, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) { console.error('[weekly-report] pref save failed', { code: error.code }); return NextResponse.json({ error: 'Could not save. Please try again.' }, { status: 503 }) }
  return NextResponse.json({ enabled: b.enabled })
}
