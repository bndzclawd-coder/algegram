import { resolvePro } from '@/lib/account/pro'
import { isChildAccount } from '@/lib/account/age-gate'
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export type ProUser = { userId: string; db: ReturnType<typeof createServiceClient> }

/** Same checks as /api/chat: signed in, server-verified age gate, active/trialing Pro subscription. */
export async function requirePro(): Promise<ProUser | NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in.', signin: true }, { status: 401 })
  const db = createServiceClient()
  const { data: profile, error: profErr } = await db.from('user_profiles').select('age_verified').eq('user_id', user.id).maybeSingle()
  if (profErr) {
    console.error('[practice] profile lookup failed', { code: profErr.code })
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 503 })
  }
  if (!profile?.age_verified) {
    return NextResponse.json(
      profile
        ? { error: "Algegram needs a parent's OK for users under 13. Your account is safe! Ask a grown-up to help.", ageRequired: true, href: '/auth/age' }
        : { error: 'Please confirm your birth year to continue.', ageRequired: true, href: '/auth/age' },
      { status: 403 })
  }
  const { isPro } = await resolvePro(db, user.id)
  if (!isPro) {
    // Under-13: no trial/upgrade CTA; the client offers only "Ask a parent about Pro" (lib/account/upsell.ts).
    const child = await isChildAccount(db, user).catch(() => true)
    return NextResponse.json(child ? { error: 'Practice and tests are part of Pro.', child: true } : { error: 'Practice and tests are part of Pro.', upgrade: true }, { status: 402 })
  }
  return { userId: user.id, db }
}
