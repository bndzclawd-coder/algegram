import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { resolvePro } from '@/lib/account/pro'
import { weeklySummary } from '@/lib/practice/weakspots'
import { sendWeeklyReport, weeklyEnabled } from '@/lib/email/weekly'
import { runTrialEnding } from '@/lib/email/trial-ending-run'
import { trialEndingEnabled } from '@/lib/email/trial-ending'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DAY = 24 * 60 * 60 * 1000
/** Stay under Resend free tier's 100/day; leftovers go out on the next run (daily schedule, 6-day spacing). */
const MAX_SENDS_PER_RUN = 90

// Vercel Cron: "Authorization: Bearer $CRON_SECRET". Opt-in Pro users who practiced in the last 7 days.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const got = Buffer.from(req.headers.get('authorization') ?? '')
  const want = Buffer.from(`Bearer ${secret ?? ''}`)
  if (!secret || secret.length < 16 || got.length !== want.length || !timingSafeEqual(got, want)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Day-5 trial-ending emails ride on this daily cron (no extra cron slot needed).
  let trialEnding: unknown = 'disabled'
  if (trialEndingEnabled()) {
    try { trialEnding = await runTrialEnding() } catch (e) { console.error('[trial-ending] run threw', { name: (e as Error)?.name }); trialEnding = 'error' }
  }
  if (!weeklyEnabled()) return NextResponse.json({ ok: true, skipped: 'disabled', trialEnding })

  const db = createServiceClient()
  const dueBefore = new Date(Date.now() - 6 * DAY).toISOString()
  const { data: prefs, error } = await db.from('report_prefs').select('user_id, last_sent_at')
    .eq('weekly_report', true).or(`last_sent_at.is.null,last_sent_at.lt.${dueBefore}`).limit(500)
  if (error) { console.error('[weekly] prefs read failed', { code: error.code }); return NextResponse.json({ ok: false }, { status: 500 }) }

  let sent = 0, skipped = 0, failed = 0
  const since = new Date(Date.now() - 14 * DAY).toISOString()
  for (const p of prefs ?? []) {
    if (sent >= MAX_SENDS_PER_RUN) break
    const [{ isPro }, prof] = await Promise.all([
      resolvePro(db, p.user_id),
      db.from('user_profiles').select('age_verified').eq('user_id', p.user_id).maybeSingle(),
    ])
    if (!isPro || !prof.data?.age_verified) { skipped++; continue }
    const { data: rows } = await db.from('practice_results').select('topic, score, total, created_at')
      .eq('user_id', p.user_id).gte('created_at', since).limit(1000)
    const s = weeklySummary(rows ?? [])
    if (!s.questions) { skipped++; continue }
    const { data: u } = await db.auth.admin.getUserById(p.user_id)
    if (!u?.user) { skipped++; continue }
    // Mark first so a retry/overlap can't double-send.
    await db.from('report_prefs').update({ last_sent_at: new Date().toISOString() }).eq('user_id', p.user_id)
    const r = await sendWeeklyReport(u.user, s)
    if ('sent' in r) sent++
    else if ('error' in r) { failed++; console.error('[weekly] send failed') }
    else skipped++
  }
  return NextResponse.json({ ok: failed === 0, sent, skipped, failed, trialEnding })
}
