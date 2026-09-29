import { NextRequest, NextResponse } from 'next/server'
import { createHmac, createHash } from 'crypto'

const GUEST_LIMIT = 5
const COOKIE_NAME = 'gl'
const RATE_LIMIT_WINDOW_MS = 4 * 60 * 60 * 1000 // 4 hours

// In-memory IP rate-limit map — keyed by hashed IP + daily salt, never by raw IP
// Never logged or linked to question content
const ipCounts = new Map<string, { count: number; expiresAt: number }>()

function getSecret() {
  const s = process.env.GUEST_COOKIE_SECRET
  if (!s) throw new Error('GUEST_COOKIE_SECRET not set')
  return s
}

function sign(value: string): string {
  const secret = getSecret()
  const mac = createHmac('sha256', secret).update(value).digest('hex')
  return `${value}.${mac}`
}

function verify(signed: string): string | null {
  const lastDot = signed.lastIndexOf('.')
  if (lastDot < 0) return null
  const value = signed.slice(0, lastDot)
  const mac = signed.slice(lastDot + 1)
  const expected = createHmac('sha256', getSecret()).update(value).digest('hex')
  // Constant-time compare
  if (mac.length !== expected.length) return null
  let diff = 0
  for (let i = 0; i < mac.length; i++) diff |= mac.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0 ? value : null
}

function readCounter(req: NextRequest): number {
  const raw = req.cookies.get(COOKIE_NAME)?.value
  if (!raw) return 0
  const verified = verify(raw)
  if (!verified) return 0
  const n = parseInt(verified, 10)
  return isNaN(n) ? 0 : Math.max(0, n)
}

function hashIp(ip: string): string {
  // Daily rotating salt prevents cross-day correlation
  const daySalt = new Date().toISOString().slice(0, 10)
  return createHash('sha256').update(`${ip}:${daySalt}`).digest('hex').slice(0, 16)
}

function checkIpRateLimit(ip: string): boolean {
  const key = hashIp(ip)
  const now = Date.now()
  const entry = ipCounts.get(key)
  if (!entry || entry.expiresAt < now) {
    ipCounts.set(key, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= GUEST_LIMIT * 3) return false // block excessive retries
  entry.count++
  return true
}

export async function GET(req: NextRequest) {
  const count = readCounter(req)
  const remaining = Math.max(0, GUEST_LIMIT - count)
  return NextResponse.json({ remaining, total: GUEST_LIMIT })
}

export async function POST(req: NextRequest) {
  const current = readCounter(req)

  if (current >= GUEST_LIMIT) {
    return NextResponse.json({ error: 'Limit reached', remaining: 0, total: GUEST_LIMIT }, { status: 429 })
  }

  // IP rate-limit check — hash never stored with content
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
  if (!checkIpRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests', remaining: 0, total: GUEST_LIMIT }, { status: 429 })
  }

  const next = current + 1
  const remaining = Math.max(0, GUEST_LIMIT - next)
  const signed = sign(String(next))

  const res = NextResponse.json({ remaining, total: GUEST_LIMIT, used: next })
  res.cookies.set(COOKIE_NAME, signed, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}
