import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Center report: seat number + topic + score only, never names or emails.
// Runs as the signed-in user; the database function returns rows only to staff of that center.
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in with your center login.' }, { status: 401 })
  const center = (req.nextUrl.searchParams.get('center') ?? '').toLowerCase()
  if (!/^[a-z0-9_]{1,40}$/.test(center)) return NextResponse.json({ error: 'Unknown center.' }, { status: 400 })
  const days = Math.min(90, Math.max(1, Number(req.nextUrl.searchParams.get('days')) || 30))
  const { data, error } = await supabase.rpc('center_score_report', { p_center: center, p_days: days })
  if (error) { console.error('[center/report] rpc failed', { code: error.code }); return NextResponse.json({ error: 'Could not load report.' }, { status: 500 }) }
  return NextResponse.json({ center, days, rows: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } })
}
