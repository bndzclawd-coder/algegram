import { createHmac, createHash, timingSafeEqual } from 'crypto'
import type { NextRequest, NextResponse } from 'next/server'

// Guest (signed-out) question limit, enforced server-side by /api/chat.
// Privacy: the IP is only ever used as a salted hash, kept in memory for a few hours,
// never logged, and never stored with question text, analytics, or sent to the AI provider.
export const GUEST_LIMIT = 5
export const GUEST_COOKIE = 'gl'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
const IP_WINDOW_MS = 4 * 60 * 60 * 1000 // 4 hours
const IP_MAX = GUEST_LIMIT * 3 // generous: shared IPs (schools, homes) still work

const ipCounts = new Map<string, { count: number; expiresAt: number }>()

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

function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
}

function ipKey(req: NextRequest, secret: string): string {
  const day = new Date().toISOString().slice(0, 10) // daily rotation: no cross-day linkage
  return createHash('sha256').update(`${secret}:${day}:${clientIp(req)}`).digest('hex').slice(0, 24)
}

/** Counts one guest request against the hashed-IP limit. Returns false if over the limit. */
export function consumeIpQuota(req: NextRequest, secret: string): boolean {
  const now = Date.now()
  if (ipCounts.size > 50_000) {
    ipCounts.forEach((v, k) => { if (v.expiresAt < now) ipCounts.delete(k) })
  }
  const key = ipKey(req, secret)
  const entry = ipCounts.get(key)
  if (!entry || entry.expiresAt < now) {
    ipCounts.set(key, { count: 1, expiresAt: now + IP_WINDOW_MS })
    return true
  }
  if (entry.count >= IP_MAX) return false
  entry.count++
  return true
}
