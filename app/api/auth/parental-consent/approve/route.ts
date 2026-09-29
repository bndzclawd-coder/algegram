import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { createServiceClient } from '@/lib/supabase/server'

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
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, userId: newUser.user?.id })
}
