import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { EMAIL_RE, needsParent, parseBirthYear } from '@/lib/age'
import { consentAgeFromHeaders } from '@/lib/consent-age'
import { consume, clientIp } from '@/lib/rate-limit'
import { recordSignupAttribution } from '@/lib/attribution/server'
import { ipHash, readRefCookie } from '@/lib/referral'
import { readCenterCookie } from '@/lib/center/link'
import { SITE_URL } from '@/lib/site-config'

export const dynamic = 'force-dynamic'

// All self-serve signups go through here so age is checked on the server.
// Under-13 is refused (they must use /api/auth/parental-consent). 13+ gets a user_profiles row
// (birth_year, age_verified=true) written with the service role; /api/chat requires that row.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const email = String(body?.email ?? '').trim().toLowerCase()
  const password = String(body?.password ?? '')
  const birthYear = parseBirthYear(body?.birthYear)

  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400 })
  if (password.length < 8 || password.length > 200) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  if (!birthYear) return NextResponse.json({ error: 'Please enter a valid birth year.' }, { status: 400 })
  const consentAge = consentAgeFromHeaders(req.headers)
  if (needsParent(birthYear, consentAge)) {
    return NextResponse.json({ error: `Users under ${consentAge} need a parent or guardian to approve the account.`, consentRequired: true, consentAge }, { status: 403 })
  }

  const rl = await consume('signup-ip', clientIp(req), 10, 60 * 60)
  if (rl === 'error') return NextResponse.json({ error: 'Please try again later.' }, { status: 503 })
  if (rl === 'limited') return NextResponse.json({ error: 'Too many sign-ups from this network. Please try again later.' }, { status: 429 })

  const wantsPro = body?.plan === 'pro'
  const origin = SITE_URL
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email, password,
    // Pro intent survives the email confirm twice over: in the redirect URL and in signup metadata
    // (in case Supabase drops the query string and falls back to the site root).
    options: { emailRedirectTo: `${origin}/auth/confirm?next=${wantsPro ? '/upgrade' : '/chat'}`, data: { birth_year: birthYear, ...(wantsPro ? { signup_plan: 'pro' } : {}) } },
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Supabase returns a placeholder user (no identities) for an already-registered email; don't touch it.
  const user = data.user
  if (user && (user.identities?.length ?? 0) > 0) {
    const { error: profErr } = await createServiceClient().from('user_profiles')
      .upsert({ user_id: user.id, birth_year: birthYear, age_verified: true, consent_age: consentAge, pending_ref_code: readRefCookie(), signup_ip_hash: ipHash(req), pending_center: readCenterCookie() }, { onConflict: 'user_id', ignoreDuplicates: true })
    if (profErr) {
      console.error('[signup] profile write failed', { code: profErr.code })
      // The user can still confirm their year later at /auth/age; chat stays locked until then.
    }
    // First-touch source, read now while we're in the signup browser (the confirm link may be
    // opened on another device without the cookie). Insert-only; never blocks signup.
    await recordSignupAttribution(createServiceClient(), user.id)
  }
  return NextResponse.json({ ok: true })
}
