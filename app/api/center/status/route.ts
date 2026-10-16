import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { centerSeatStatus, readCenterCookie } from '@/lib/center/link'
import { centerDisplayName } from '@/lib/center/display'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// For visitors who came through a center link (signed cookie): seat status + center display name only.
export async function GET() {
  const slug = readCenterCookie()
  if (!slug) return NextResponse.json({ full: false, center: null }, { headers: { 'Cache-Control': 'no-store' } })
  const db = createServiceClient() as any
  const status = await centerSeatStatus(db, slug)
  const { data } = status === 'open' ? await db.from('center_pilots').select('display_name').eq('center_slug', slug).maybeSingle() : { data: null }
  return NextResponse.json({ full: status === 'full', center: status === 'open' ? centerDisplayName(slug, data?.display_name) : null }, { headers: { 'Cache-Control': 'no-store' } })
}
