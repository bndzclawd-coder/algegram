import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { EMAIL_RE } from '@/lib/age'
import { checkConsentLimits, sendConsentEmail, withTimeout, KID_SEND_ERROR, LIMITS_TIMEOUT_MS } from '@/lib/account/consent-email'
import { EXISTING_CONSENT_TOKEN, deleteAfter } from '@/lib/account/pause'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

async function pausedProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null, error: null }
  const { data, error } = await createServiceClient().from('user_profiles')
    .select('birth_year, age_verified, paused_at').eq('user_id', user.id).maybeSingle()
  return { user, profile: data, error }
}

// Status for /auth/age: is this account paused waiting for a parent?
export async function GET() {
  const { user, profile, error } = await pausedProfile()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (error) return NextResponse.json({ error: 'Please try again later.' }, { status: 503 })
  const paused = !!profile && !profile.age_verified
  return NextResponse.json({
    hasProfile: !!profile,
    paused,
    deleteAfter: paused && profile.paused_at ? deleteAfter(profile.paused_at).toISOString() : null,
  })
}

// A grown-up enters their email; we send the existing parental consent email for THIS account.
export async function POST(req: NextRequest) {
  const { user, profile, error } = await pausedProfile()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (error) return NextResponse.json({ error: 'Please try again later.' }, { status: 503 })
  if (!profile || profile.age_verified) return NextResponse.json({ error: 'This account does not need approval.' }, { status: 400 })

  const body = await req.json().catch(() => null)
  const parentEmail = String(body?.parentEmail ?? '').trim().toLowerCase()
  const childEmail = String(user.email ?? '').trim().toLowerCase()
  if (!EMAIL_RE.test(parentEmail)) return NextResponse.json({ error: 'Please check the email address.' }, { status: 400 })
  if (parentEmail === childEmail) return NextResponse.json({ error: "Please use your own email address, not your child's." }, { status: 400 })

  const secret = process.env.CONSENT_JWT_SECRET
  if (!secret) return NextResponse.json({ error: 'Server config error.' }, { status: 500 })

  let limited
  try {
    limited = await withTimeout(checkConsentLimits(req, parentEmail), LIMITS_TIMEOUT_MS, 'rate-limit')
  } catch (e) {
    console.error('[consent] limit check failed', { name: (e as Error)?.name })
    return NextResponse.json({ error: KID_SEND_ERROR }, { status: 503 })
  }
  if (limited) return NextResponse.json({ error: limited.error }, { status: limited.status })

  const token = jwt.sign(
    { userId: user.id, childEmail, parentEmail, childBirthYear: profile.birth_year, type: EXISTING_CONSENT_TOKEN },
    secret, { expiresIn: '1h' },
  )
  const sent = await sendConsentEmail({ parentEmail, childEmail, childBirthYear: profile.birth_year, token, existingAccount: true })
  if (!sent) return NextResponse.json({ error: KID_SEND_ERROR }, { status: 502 })
  return NextResponse.json({ ok: true })
}
