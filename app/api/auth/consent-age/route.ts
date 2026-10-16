import { NextRequest, NextResponse } from 'next/server'
import { consentAgeFromHeaders } from '@/lib/consent-age'

export const dynamic = 'force-dynamic'

// Parental-consent age for this visitor's country (from Vercel's geo header). Nothing is stored.
export function GET(req: NextRequest) {
  return NextResponse.json({ age: consentAgeFromHeaders(req.headers) }, { headers: { 'Cache-Control': 'no-store' } })
}
