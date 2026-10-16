import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { hadStripeSubscription } from '@/lib/account/trial'

export const dynamic = 'force-dynamic'

// Tells the UI which button text to show. Checkout re-checks server-side, so this is display-only.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ eligible: true, signedIn: false }, { headers: { 'Cache-Control': 'no-store' } })
  const { data: sub } = await createServiceClient().from('subscriptions').select('stripe_customer_id').eq('user_id', user.id).maybeSingle()
  try {
    const had = await hadStripeSubscription([sub?.stripe_customer_id], user.email)
    return NextResponse.json({ eligible: !had, signedIn: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ eligible: null, signedIn: true }, { headers: { 'Cache-Control': 'no-store' } })
  }
}
