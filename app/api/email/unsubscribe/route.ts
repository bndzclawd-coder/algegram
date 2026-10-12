import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyUnsubscribeToken } from '@/lib/email/lifecycle'
import { verifyWeeklyUnsubToken } from '@/lib/email/weekly'

export const dynamic = 'force-dynamic'

const isWeekly = (req: NextRequest) => req.nextUrl.searchParams.get('k') === 'weekly'

async function optOut(req: NextRequest) {
  const u = req.nextUrl.searchParams.get('u') ?? ''
  const t = req.nextUrl.searchParams.get('t') ?? ''
  if (isWeekly(req)) {
    if (!/^[0-9a-f-]{36}$/i.test(u) || !verifyWeeklyUnsubToken(u, t)) return false
    const { error } = await createServiceClient().from('report_prefs')
      .upsert({ user_id: u, weekly_report: false, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    if (error) { console.error('[unsubscribe] weekly failed:', error.message); return false }
    return true
  }
  if (!/^[0-9a-f-]{36}$/i.test(u) || !verifyUnsubscribeToken(u, t)) return false
  const db = createServiceClient()
  const { error } = await db
    .from('user_attribution')
    .upsert({ user_id: u, marketing_opt_out: true }, { onConflict: 'user_id' })
  if (error) {
    console.error('[unsubscribe] failed:', error.message)
    return false
  }
  return true
}

// One-click unsubscribe (RFC 8058): mail clients POST here.
export async function POST(req: NextRequest) {
  const ok = await optOut(req)
  return NextResponse.json({ ok }, { status: ok ? 200 : 400 })
}

// Link in the email body.
export async function GET(req: NextRequest) {
  const ok = await optOut(req)
  const msg = ok && isWeekly(req)
    ? 'Weekly progress reports are turned off. You can turn them back on in Settings.'
    : ok
    ? 'You are unsubscribed from Algegram tips and offers. Account emails (like password resets) still arrive.'
    : 'This unsubscribe link is invalid. Email support@algegram.xyz and we will remove you.'
  return new NextResponse(
    `<!doctype html><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe | Algegram</title><p style="font-family:system-ui;max-width:520px;margin:3rem auto;padding:0 1rem">${msg}</p>`,
    { status: ok ? 200 : 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}
