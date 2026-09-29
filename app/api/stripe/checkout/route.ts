import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()

  // Get or create Stripe customer
  let { data: sub } = await db.from('subscriptions').select('stripe_customer_id').eq('user_id', user.id).single()
  let customerId = sub?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await db.from('subscriptions').upsert(
      { user_id: user.id, stripe_customer_id: customerId },
      { onConflict: 'user_id' }
    )
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRICE_PRO_MONTHLY!, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/chat?upgraded=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: 7,
      metadata: { supabase_user_id: user.id },
    },
    managed_payments: { enabled: false },
  } as any)

  return NextResponse.json({ url: session.url })
}
