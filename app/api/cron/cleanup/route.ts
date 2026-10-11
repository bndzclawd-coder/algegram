import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { deleteAccountData } from '@/lib/account/delete'
import { pauseBilling, resumeBilling } from '@/lib/account/billing'
import { PAUSE_DAYS } from '@/lib/account/pause'

export const dynamic = 'force-dynamic'

// Daily retention job. Vercel Cron sends "Authorization: Bearer $CRON_SECRET".
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const got = Buffer.from(req.headers.get('authorization') ?? '')
  const want = Buffer.from(`Bearer ${secret ?? ''}`)
  if (!secret || secret.length < 16 || got.length !== want.length || !timingSafeEqual(got, want)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const db = createServiceClient()
  const usage = await db.rpc('cleanup_old_usage')
  const buckets = await db.rpc('cleanup_rate_limits')
  if (usage.error || buckets.error) {
    console.error('[cron] cleanup failed', { usage: usage.error?.code, buckets: buckets.error?.code })
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  // Under-13 accounts paused with no parental consent for 14 days: delete via the normal
  // deletion path, cancelling Stripe and refunding the current period. Per-account failures
  // are logged (no ids/emails) and retried tomorrow.
  const cutoff = new Date(Date.now() - PAUSE_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const { data: expired, error: expErr } = await db.from('user_profiles')
    .select('user_id').eq('age_verified', false).not('paused_at', 'is', null).lt('paused_at', cutoff).limit(100)
  if (expErr) {
    console.error('[cron] paused lookup failed', { code: expErr.code })
    return NextResponse.json({ ok: false }, { status: 500 })
  }
  let accountsDeleted = 0, accountsFailed = 0
  for (const row of expired ?? []) {
    const r = await deleteAccountData(db, row.user_id, { refundCurrentPeriod: true })
    if (r.ok) accountsDeleted++
    else { accountsFailed++; console.error('[cron] paused account delete failed', { stage: r.stage }) }
  }

  // Retry billing changes that failed at pause/consent time.
  const { data: toPause } = await db.from('user_profiles').select('user_id')
    .eq('age_verified', false).eq('billing_paused', false).not('paused_at', 'is', null).limit(100)
  for (const row of toPause ?? []) await pauseBilling(db, row.user_id)
  const { data: toResume } = await db.from('user_profiles').select('user_id')
    .eq('age_verified', true).eq('billing_paused', true).limit(100)
  for (const row of toResume ?? []) await resumeBilling(db, row.user_id)

  return NextResponse.json({ ok: accountsFailed === 0, deleted: usage.data, accountsDeleted, accountsFailed }, { status: accountsFailed ? 500 : 200 })
}
