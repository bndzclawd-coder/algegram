import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { centerSeatStatus, readCenterCookie } from '@/lib/center/link'

export const dynamic = 'force-dynamic'

// Seats-full notice for visitors who came through a center link (signed cookie). Returns status only.
export async function GET() {
  const slug = readCenterCookie()
  const status = slug ? await centerSeatStatus(createServiceClient() as any, slug) : 'none'
  return NextResponse.json({ full: status === 'full' }, { headers: { 'Cache-Control': 'no-store' } })
}
