import { NextRequest, NextResponse } from 'next/server'
import { guestSecret } from '@/lib/guest-limit'
import { setGuestAge, readGuestAge } from '@/lib/guest-age'
import { isUnder13, parseBirthYear } from '@/lib/age'

export const dynamic = 'force-dynamic'

// Guest age screen. The year is used once to pick a band and is never stored or logged.
// The response is identical for every valid year, so it doesn't reveal which ages "pass".
export async function POST(req: NextRequest) {
  const secret = guestSecret()
  if (!secret) return NextResponse.json({ error: 'Temporarily unavailable.' }, { status: 503 })
  const body = await req.json().catch(() => null)
  const by = parseBirthYear(body?.birthYear)
  if (!by) return NextResponse.json({ error: 'Please choose a year.' }, { status: 400 })
  const res = NextResponse.json({ ok: true })
  // An under-13 answer is locked for the session: changing the year later doesn't change the band.
  const locked = readGuestAge(req, secret) === 'c'
  setGuestAge(res, secret, locked || isUnder13(by) ? 'c' : 'a')
  return res
}
