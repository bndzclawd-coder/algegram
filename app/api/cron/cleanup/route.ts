import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Daily retention job. Vercel Cron sends "Authorization: Bearer $CRON_SECRET".
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const got = Buffer.from(req.headers.get('authorization') ?? '')
  const want = Buffer.from(`Bearer ${secret ?? ''}`)
  if (!secret || secret.length < 16 || got.length !== want.length || !timingSafeEqual(got, want)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const db = createServiceClient()
  const usage = await db.rpc('cleanup_old_usage')
  const buckets = await db.rpc('cleanup_rate_limits')
  if (usage.error || buckets.error) {
    console.error('[cron] cleanup failed', { usage: usage.error?.code, buckets: buckets.error?.code })
    return NextResponse.json({ ok: false }, { status: 500 })
  }
  return NextResponse.json({ ok: true, deleted: usage.data })
}
