import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isUnder13, parseBirthYear } from '@/lib/age'

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

  if (isUnder13(birthYear)) {
    // Record the answer (unverified) so it can't be retried with an older year; chat stays locked.
    await db.from('user_profiles').insert({ user_id: user.id, birth_year: birthYear, age_verified: false })
    return NextResponse.json({ error: 'Users under 13 need a parent or guardian to approve the account. Please sign up again with a parent email.', consentRequired: true }, { status: 403 })
  }

  const { error } = await db.from('user_profiles').insert({ user_id: user.id, birth_year: birthYear, age_verified: true })
  if (error) return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
