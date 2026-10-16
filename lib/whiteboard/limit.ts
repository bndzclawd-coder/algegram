import { createHmac, timingSafeEqual } from 'crypto'
import type { NextRequest, NextResponse } from 'next/server'

// Free whiteboard lessons per UTC day for guests and Free accounts. Pro has a higher fair-use allowance.
export const FREE_LESSONS_PER_DAY = 1
// Guest counter cookie: "<UTC day>:<count>.<hmac>". No identifiers, no question text.
export const LESSON_COOKIE = 'wl'

const today = () => new Date().toISOString().slice(0, 10)
const mac = (secret: string, v: string) => createHmac('sha256', secret + ':lesson').update(v).digest('hex')

export function readGuestLessons(req: NextRequest, secret: string): number {
  const raw = req.cookies.get(LESSON_COOKIE)?.value
  if (!raw) return 0
  const i = raw.lastIndexOf('.')
  if (i < 0) return FREE_LESSONS_PER_DAY
  const value = raw.slice(0, i)
  const got = Buffer.from(raw.slice(i + 1)), want = Buffer.from(mac(secret, value))
  if (got.length !== want.length || !timingSafeEqual(got, want)) return FREE_LESSONS_PER_DAY // tampered = used
  const [day, n] = value.split(':')
  if (day !== today()) return 0
  const c = parseInt(n, 10)
  return Number.isFinite(c) ? Math.max(0, c) : FREE_LESSONS_PER_DAY
}

export function setGuestLessons(res: NextResponse, secret: string, n: number) {
  const value = `${today()}:${n}`
  res.cookies.set(LESSON_COOKIE, `${value}.${mac(secret, value)}`, {
    httpOnly: true, sameSite: 'strict', path: '/', maxAge: 60 * 60 * 26, secure: process.env.NODE_ENV === 'production',
  })
}
