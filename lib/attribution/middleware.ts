// Edge-safe helper used by /middleware.ts. First-touch only: never overwrites an existing cookie.
// PRIVACY RULE: internal reporting only; never forwarded to ad pixels or used for retargeting.
import type { NextRequest, NextResponse } from 'next/server'
import { ATTR_COOKIE, ATTR_MAX_AGE, attributionFromSearchParams, encodeAttribution } from './attribution'

const REF_RE = /^[a-z2-9]{8}$/

/**
 * Background fetches that are not a page view: Next.js <Link> prefetches (Next-Router-Prefetch), browser
 * speculative loads (Purpose / Sec-Purpose: prefetch or prerender), and Next's middleware prefetch. A
 * prefetch of a tagged link must never set or change the attribution or referral cookie; only a real view
 * (a page load, or a client navigation the visitor actually clicked) can.
 */
export function isPrefetchRequest(headers: Pick<Headers, 'get'>): boolean {
  if (headers.get('next-router-prefetch')) return true
  if (headers.get('x-middleware-prefetch')) return true
  for (const h of ['purpose', 'sec-purpose', 'x-purpose', 'x-moz']) {
    const v = headers.get(h)?.toLowerCase() ?? ''
    if (v.includes('prefetch') || v.includes('prerender')) return true
  }
  return false
}

export function withAttribution(req: NextRequest, res: NextResponse): NextResponse {
  if (isPrefetchRequest(req.headers)) return res
  // Referral code (?ref=CODE): latest referral link wins, 30 days. Random code only, no personal data.
  const ref = req.nextUrl.searchParams.get('ref')?.trim().toLowerCase()
  if (ref && REF_RE.test(ref)) {
    res.cookies.set('ag_ref', ref, { maxAge: ATTR_MAX_AGE, path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production', httpOnly: true })
  }
  if (req.cookies.get(ATTR_COOKIE)) return res
  const attr = attributionFromSearchParams(req.nextUrl.searchParams, req.nextUrl.pathname, req.headers.get('referer'))
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
