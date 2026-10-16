import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { needsParent, parseBirthYear } from '@/lib/age'
import { consentAgeFromHeaders } from '@/lib/consent-age'
import { pauseBilling } from '@/lib/account/billing'

export const dynamic = 'force-dynamic'

// One-time age confirmation for signed-in accounts with no server-verified age
// (accounts created before PR #4, or created by calling Supabase signUp directly).
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const birthYear = parseBirthYear(body?.birthYear)
  if (!birthYear) return NextResponse.json({ error: 'Please enter a valid birth year.' }, { status: 400 })

  const db = createServiceClient()
  const { data: existing } = await db.from('user_profiles').select('user_id').eq('user_id', user.id).maybeSingle()
  if (existing) return NextResponse.json({ error: 'Birth year is already set.' }, { status: 409 })

  const consentAge = consentAgeFromHeaders(req.headers)
  if (needsParent(birthYear, consentAge)) {
    // Record the answer (unverified) so it can't be retried with an older year; chat stays paused.
    // paused_at starts the 14-day window for a parent to approve before the account is deleted.
    const { error: insErr } = await db.from('user_profiles').insert({ user_id: user.id, birth_year: birthYear, consent_age: consentAge, age_verified: false, paused_at: new Date().toISOString() })
    if (insErr) return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    // Don't bill for an account the child can't use. On failure the daily cron retries.
    await pauseBilling(db, user.id)
    return NextResponse.json({ error: `Algegram needs a parent's OK for users under ${consentAge}. Please ask a grown-up to help with the next step.`, consentRequired: true }, { status: 403 })
  }

  const { error } = await db.from('user_profiles').insert({ user_id: user.id, birth_year: birthYear, consent_age: consentAge, age_verified: true })
  if (error) return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
