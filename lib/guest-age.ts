import { createHmac, timingSafeEqual } from 'crypto'
import type { NextRequest, NextResponse } from 'next/server'

// Neutral age screen for guests. Stores ONLY an age band ('a' = 13+, 'c' = under 13) in a
// session-scoped (no Max-Age), HMAC-signed, httpOnly cookie. No birth year, no DB row,
// never linked to question text.
export const GUEST_AGE_COOKIE = 'ga'
export type AgeBand = 'a' | 'c'

const mac = (secret: string, v: string) => createHmac('sha256', secret).update(`guest-age:${v}`).digest('hex')

export function readGuestAge(req: NextRequest, secret: string): AgeBand | null {
  const raw = req.cookies.get(GUEST_AGE_COOKIE)?.value
  if (!raw) return null
  const [band, sig] = raw.split('.')
  if (band !== 'a' && band !== 'c' || !sig) return null
  const a = Buffer.from(sig), b = Buffer.from(mac(secret, band))
  return a.length === b.length && timingSafeEqual(a, b) ? band : null
}

export function setGuestAge(res: NextResponse, secret: string, band: AgeBand) {
  res.cookies.set(GUEST_AGE_COOKIE, `${band}.${mac(secret, band)}`, {
    httpOnly: true, sameSite: 'strict', path: '/', secure: process.env.NODE_ENV === 'production',
  })
}
