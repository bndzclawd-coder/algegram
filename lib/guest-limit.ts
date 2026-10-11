import { createHmac, timingSafeEqual } from 'crypto'
import { consume, clientIp } from '@/lib/rate-limit'
import type { NextRequest, NextResponse } from 'next/server'

// Guest (signed-out) question limit, enforced server-side by /api/chat.
// Privacy: the IP is only ever used as a salted hash, stored in the database for a few hours,
// never logged, and never stored with question text, analytics, or sent to the AI provider.
export const GUEST_LIMIT = 5
export const GUEST_COOKIE = 'gl'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
const IP_WINDOW_S = 4 * 60 * 60 // 4 hours
const IP_MAX = GUEST_LIMIT * 3 // generous: shared IPs (schools, homes) still work

export function guestSecret(): string | null {
  const s = process.env.GUEST_COOKIE_SECRET
  return s && s.length >= 16 ? s : null
}

function mac(secret: string, value: string) {
  return createHmac('sha256', secret).update(value).digest('hex')
}

export function readGuestCount(req: NextRequest, secret: string): number {
  const raw = req.cookies.get(GUEST_COOKIE)?.value
  if (!raw) return 0
  const i = raw.lastIndexOf('.')
  if (i < 0) return GUEST_LIMIT // tampered cookie: treat as exhausted, not as fresh
  const value = raw.slice(0, i)
  const got = Buffer.from(raw.slice(i + 1))
  const expected = Buffer.from(mac(secret, value))
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) return GUEST_LIMIT
  const n = parseInt(value, 10)
  return Number.isFinite(n) ? Math.max(0, n) : GUEST_LIMIT
}

export function setGuestCount(res: NextResponse, secret: string, n: number) {
  res.cookies.set(GUEST_COOKIE, `${n}.${mac(secret, String(n))}`, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  })
}

/**
 * Counts one guest request against the per-network backstop, stored in the database
 * (public.rate_limit_buckets) so it survives cookie clearing and serverless cold starts.
 * Key = sha256(secret:guest-ip:UTC day:ip); never the raw IP, never logged, never linked to
 * question text or analytics; rows expire after 4 hours. Fails closed ('error').
 */
export async function consumeIpQuota(req: NextRequest): Promise<'ok' | 'limited' | 'error'> {
  return consume('guest-ip', clientIp(req), IP_MAX, IP_WINDOW_S)
}
