import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { LIVE_STATUSES } from '@/lib/account/subscription-status'

export const dynamic = 'force-dynamic'

// For the pricing page: does the signed-in user already have an active/trialing subscription?
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ subscribed: false })
  const { data: sub } = await createServiceClient().from('subscriptions')
    .select('status, stripe_subscription_id').eq('user_id', user.id).maybeSingle()
  return NextResponse.json({ subscribed: !!sub?.stripe_subscription_id && LIVE_STATUSES.has(String(sub.status)) })
}
