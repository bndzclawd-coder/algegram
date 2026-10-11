// Edge-safe helper used by /middleware.ts. First-touch only: never overwrites an existing cookie.
// PRIVACY RULE: internal reporting only; never forwarded to ad pixels or used for retargeting.
import type { NextRequest, NextResponse } from 'next/server'
import { ATTR_COOKIE, ATTR_MAX_AGE, attributionFromSearchParams, encodeAttribution } from './attribution'

export function withAttribution(req: NextRequest, res: NextResponse): NextResponse {
  if (req.cookies.get(ATTR_COOKIE)) return res
  const attr = attributionFromSearchParams(req.nextUrl.searchParams, req.nextUrl.pathname)
  if (!attr) return res
  res.cookies.set(ATTR_COOKIE, encodeAttribution(attr), {
    maxAge: ATTR_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true, // read server-side only (signup + checkout)
  })
  return res
}
