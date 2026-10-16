import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { centerSeatStatus, setCenterCookie } from '@/lib/center/link'

export const dynamic = 'force-dynamic'

const SLUG = /^[a-z0-9_-]{1,40}$/

// Short pilot links for cold emails: /p/<center> -> tagged homepage (first-touch cookie set there).
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug
  if (!SLUG.test(slug)) {
    return new NextResponse('Not found', { status: 404, headers: { 'X-Robots-Tag': 'noindex, nofollow' } })
  }
  const url = new URL('/', req.nextUrl.origin)
  url.searchParams.set('utm_source', 'pilot')
  url.searchParams.set('utm_medium', 'email')
  url.searchParams.set('utm_campaign', slug.replace(/-/g, '_'))
  const center = slug.replace(/-/g, '_')
  // Only centers with a center_pilots record get the signed enrollment cookie; others = attribution only.
  const status = await centerSeatStatus(createServiceClient() as any, center)
  if (status !== 'none') url.searchParams.set('center', status) // 'open' | 'full': lets the landing show the banner at once
  const res = NextResponse.redirect(url, 307)
  if (status !== 'none') setCenterCookie(res, center)
  res.headers.set('X-Robots-Tag', 'noindex, nofollow')
  res.headers.set('Cache-Control', 'no-store')
  return res
}
