import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { EXISTING_CONSENT_TOKEN } from '@/lib/account/pause'
import { createServiceClient } from '@/lib/supabase/server'
import { tokenStatus, USED_LINK_ERROR } from '@/lib/account/consent-token'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token.' }, { status: 400 })

  const secret = process.env.CONSENT_JWT_SECRET
  if (!secret) return NextResponse.json({ error: 'Server config error.' }, { status: 500 })

  let payload: { childEmail: string; parentEmail: string; childBirthYear: number; type: string }
  try {
    payload = jwt.verify(token, secret) as { childEmail: string; parentEmail: string; childBirthYear: number; type: string }
    if (payload.type !== 'parental-consent' && payload.type !== EXISTING_CONSENT_TOKEN) throw new Error('Wrong token type')
  } catch {
    return NextResponse.json({ error: 'Link expired or invalid. Please ask the child to sign up again.' }, { status: 400 })
  }
  // Read-only: a GET never writes. A used link shows the "already used" page.
  const status = await tokenStatus(createServiceClient(), token)
  if (status === 'used') return NextResponse.json({ error: USED_LINK_ERROR, used: true }, { status: 410 })
  if (status === 'error') return NextResponse.json({ error: 'Please try again later.' }, { status: 503 })
  {
    return NextResponse.json({
      childEmail: payload.childEmail, parentEmail: payload.parentEmail, childBirthYear: payload.childBirthYear,
      existingAccount: payload.type === EXISTING_CONSENT_TOKEN,
    })
  }
}
