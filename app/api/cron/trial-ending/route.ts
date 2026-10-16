import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { trialEndingEnabled } from '@/lib/email/trial-ending'
import { runTrialEnding } from '@/lib/email/trial-ending-run'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Daily (called from the weekly-report cron). Finds Pro that ends 36-60h from now (day 5 of 7):
// signup/referral bonus, or a Stripe trial. Sends once per account (user_profiles.trial_ending_sent_at).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const got = Buffer.from(req.headers.get('authorization') ?? '')
  const want = Buffer.from(`Bearer ${secret ?? ''}`)
  if (!secret || secret.length < 16 || got.length !== want.length || !timingSafeEqual(got, want)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!trialEndingEnabled()) return NextResponse.json({ ok: true, skipped: 'disabled' })
  return NextResponse.json(await runTrialEnding())
}

