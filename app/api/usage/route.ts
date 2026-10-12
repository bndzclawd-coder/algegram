import { resolvePro } from '@/lib/account/pro'
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/plans'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const today = new Date().toISOString().split('T')[0]

  const [{ data: usageRow }, { isPro, comp, paid, compProUntil, sub }] = await Promise.all([
    db.from('usage').select('count').eq('user_id', user.id).eq('day', today).single(),
    resolvePro(db, user.id),
  ])
  const used = usageRow?.count ?? 0
  const limit = isPro ? null : PLANS.free.messagesPerDay

  return NextResponse.json({
    plan: isPro ? 'pro' : 'free',
    status: paid ? sub?.status : 'active',
    comp,
    compProUntil,
    used,
    limit,
    remaining: limit !== null ? Math.max(0, limit - used) : null,
    periodEnd: paid ? (sub?.current_period_end ?? null) : comp ? compProUntil : null,
  })
}
