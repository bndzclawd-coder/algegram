import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { createServiceClient } from '@/lib/supabase/server'
import { resumeBilling } from '@/lib/account/billing'
import { EXISTING_CONSENT_TOKEN } from '@/lib/account/pause'

export const dynamic = 'force-dynamic'

// Parent approves an EXISTING paused under-13 account: keep the account, mark it verified,
// clear the pause and resume Stripe collection.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const token = String(body?.token ?? '')
  if (!token) return NextResponse.json({ error: 'Missing token.' }, { status: 400 })
  const secret = process.env.CONSENT_JWT_SECRET
  if (!secret) return NextResponse.json({ error: 'Server config error.' }, { status: 500 })

  let payload: { userId: string; type: string }
  try {
    payload = jwt.verify(token, secret) as any
    if (payload.type !== EXISTING_CONSENT_TOKEN || typeof payload.userId !== 'string') throw new Error('bad')
  } catch {
    return NextResponse.json({ error: 'Link expired or invalid.' }, { status: 400 })
  }

  const db = createServiceClient()
  const { data: profile, error } = await db.from('user_profiles').select('age_verified').eq('user_id', payload.userId).maybeSingle()
  if (error) return NextResponse.json({ error: 'Please try again later.' }, { status: 503 })
  if (!profile) return NextResponse.json({ error: 'This account no longer exists.' }, { status: 404 })
  if (profile.age_verified) return NextResponse.json({ ok: true, alreadyApproved: true })

  const { error: upErr } = await db.from('user_profiles')
    .update({ age_verified: true, parental_consent: true, paused_at: null })
    .eq('user_id', payload.userId)
  if (upErr) return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })

  // If Stripe is down, billing_paused stays true and the daily cron retries the resume.
  const billing = await resumeBilling(db, payload.userId)
  return NextResponse.json({ ok: true, billingResumePending: billing === 'error' })
}
