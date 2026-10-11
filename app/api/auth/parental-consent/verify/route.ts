import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { EXISTING_CONSENT_TOKEN } from '@/lib/account/pause'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token.' }, { status: 400 })

  const secret = process.env.CONSENT_JWT_SECRET
  if (!secret) return NextResponse.json({ error: 'Server config error.' }, { status: 500 })

  try {
    const payload = jwt.verify(token, secret) as { childEmail: string; parentEmail: string; childBirthYear: number; type: string }
    if (payload.type !== 'parental-consent' && payload.type !== EXISTING_CONSENT_TOKEN) throw new Error('Wrong token type')
    return NextResponse.json({
      childEmail: payload.childEmail, parentEmail: payload.parentEmail, childBirthYear: payload.childBirthYear,
      existingAccount: payload.type === EXISTING_CONSENT_TOKEN,
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'Link expired or invalid. Please ask the child to sign up again.' }, { status: 400 })
  }
}
