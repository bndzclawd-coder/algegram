import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/stripe'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const today = new Date().toISOString().split('T')[0]

  const [{ data: usageRow }, { data: sub }] = await Promise.all([
    db.from('usage').select('count').eq('user_id', user.id).eq('day', today).single(),
    db.from('subscriptions').select('plan, status, current_period_end').eq('user_id', user.id).single(),
  ])

  const isPro = sub?.plan === 'pro' && sub?.status === 'active'
  const used = usageRow?.count ?? 0
  const limit = isPro ? null : PLANS.free.messagesPerDay

  return NextResponse.json({
    plan: sub?.plan ?? 'free',
    status: sub?.status ?? 'active',
    used,
    limit,
    remaining: limit !== null ? Math.max(0, limit - used) : null,
    periodEnd: sub?.current_period_end ?? null,
  })
}
