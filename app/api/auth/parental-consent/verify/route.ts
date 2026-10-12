import { NextRequest, NextResponse } from 'next/server'
import { verifyConsentToken } from '@/lib/account/consent-verify'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const r = await verifyConsentToken(req.nextUrl.searchParams.get('token'))
  const headers = { 'Cache-Control': 'no-store' }
  if (r.ok === true) return NextResponse.json((r as any).data, { headers })
  const e = r as { error: string; used?: boolean; status: number }
  return NextResponse.json({ error: e.error, ...(e.used ? { used: true } : {}) }, { status: e.status, headers })
}
