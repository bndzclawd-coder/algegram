import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { createServiceClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/email/lifecycle'
import { claimToken, releaseToken, USED_LINK_ERROR } from '@/lib/account/consent-token'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()
  if (!token || !password) return NextResponse.json({ error: 'Missing token or password.' }, { status: 400 })

  const secret = process.env.CONSENT_JWT_SECRET
  if (!secret) return NextResponse.json({ error: 'Server config error.' }, { status: 500 })

  let payload: { childEmail: string; parentEmail: string; childBirthYear: number; type: string }
  try {
    payload = jwt.verify(token, secret) as any
    if (payload.type !== 'parental-consent') throw new Error('Wrong token type')
  } catch {
    return NextResponse.json({ error: 'Link expired or invalid.' }, { status: 400 })
  }

  if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })

  const db = createServiceClient()

  // Single use: claim the link before creating anything. A second POST can never set a password.
  const claim = await claimToken(db, token, 'approve')
  if (claim === 'used') return NextResponse.json({ error: USED_LINK_ERROR, used: true }, { status: 410 })
  if (claim === 'error') return NextResponse.json({ error: 'Please try again later.' }, { status: 503 })

  // Create user via Supabase admin
  const { data: newUser, error } = await db.auth.admin.createUser({
    email: payload.childEmail,
    password,
    email_confirm: true,
    user_metadata: {
      no_history: true, // under-13: no history until consent is updated
      parental_consent: true,
      birth_year: payload.childBirthYear,
      parent_email: payload.parentEmail,
    },
  })

  if (error) {
    await releaseToken(db, token) // nothing was created; let the parent retry
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Server-verified age record: lets this account use /api/chat.
  if (newUser.user) {
    const { error: profErr } = await db.from('user_profiles').upsert({
      user_id: newUser.user.id, birth_year: payload.childBirthYear, age_verified: true, parental_consent: true,
    })
    if (profErr) console.error('[consent] profile write failed', { code: profErr.code })
  }

  // Account-only welcome to the PARENT (no promo). No-op unless LIFECYCLE_EMAILS_ENABLED=true.
  if (newUser.user) {
    try { await sendWelcomeEmail(newUser.user) } catch (e) { console.error('[consent] welcome email failed:', e) }
  }

  return NextResponse.json({ ok: true, userId: newUser.user?.id })
}
