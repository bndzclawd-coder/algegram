import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { createServiceClient } from '@/lib/supabase/server'
import { EXISTING_CONSENT_TOKEN } from '@/lib/account/pause'
import { claimToken, USED_LINK_ERROR } from '@/lib/account/consent-token'

export const dynamic = 'force-dynamic'

// Parent declines: burns the link so it can never be used to approve later. Changes no account data
// (a new signup was never created; a paused existing account is deleted by the 14-day cleanup).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const token = String(body?.token ?? '')
  if (!token) return NextResponse.json({ error: 'Missing token.' }, { status: 400 })
  const secret = process.env.CONSENT_JWT_SECRET
  if (!secret) return NextResponse.json({ error: 'Server config error.' }, { status: 500 })
  try {
    const p = jwt.verify(token, secret) as { type: string }
    if (p.type !== 'parental-consent' && p.type !== EXISTING_CONSENT_TOKEN) throw new Error('bad')
  } catch {
    return NextResponse.json({ error: 'Link expired or invalid.' }, { status: 400 })
  }
  const claim = await claimToken(createServiceClient(), token, 'decline')
  if (claim === 'used') return NextResponse.json({ error: USED_LINK_ERROR, used: true }, { status: 410 })
  if (claim === 'error') return NextResponse.json({ error: 'Please try again later.' }, { status: 503 })
  return NextResponse.json({ ok: true })
}
