import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { attributionLabel, readAttribution } from '@/lib/attribution/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()

  // Get or create Stripe customer
  const { data: sub, error: subError } = await db
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()
  if (subError && subError.code !== 'PGRST116') {
    console.error('Supabase error fetching subscription:', subError)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  let customerId = sub?.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    const { error: upsertError } = await db.from('subscriptions').upsert(
      { user_id: user.id, stripe_customer_id: customerId },
      { onConflict: 'user_id' }
    )
    if (upsertError) {
      console.error('Supabase error upserting customer:', upsertError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
  }

  // First-touch source label (e.g. "ig", "pilot-firecracker"). Internal revenue reporting only;
  // never forwarded to ad platforms. Stripe metadata values must be strings, so omit when absent.
  const ref = attributionLabel(readAttribution())
  const refMeta: Record<string, string> = ref ? { ref } : {}

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    client_reference_id: user.id,
    metadata: { supabase_user_id: user.id, ...refMeta },
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/chat?upgraded=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: 7,
      metadata: { supabase_user_id: user.id, ...refMeta },
    },
    managed_payments: { enabled: false },
  } as any)

  return NextResponse.json({ url: session.url })
}
