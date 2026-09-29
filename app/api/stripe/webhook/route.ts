import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature failed' }, { status: 400 })
  }

  const db = createServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break
      const subId = session.subscription as string
      const custId = session.customer as string
      if (!subId) break
      const sub = await stripe.subscriptions.retrieve(subId)
      const userId = sub.metadata.supabase_user_id
      if (!userId) break
      const { error } = await db.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: custId,
        stripe_subscription_id: subId,
        plan: sub.status === 'active' || sub.status === 'trialing' ? 'pro' : 'free',
        status: sub.status,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      }, { onConflict: 'user_id' })
      if (error) console.error('Supabase error (checkout.session.completed):', error)
      break
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata.supabase_user_id
      if (!userId) break
      const { error } = await db.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: sub.customer as string,
        stripe_subscription_id: sub.id,
        plan: sub.status === 'active' || sub.status === 'trialing' ? 'pro' : 'free',
        status: sub.status,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      }, { onConflict: 'user_id' })
      if (error) console.error('Supabase error (subscription created/updated):', error)
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const custId = sub.customer as string
      const { error } = await db.from('subscriptions').update({
        plan: 'free',
        status: 'canceled',
        stripe_subscription_id: null,
      }).eq('stripe_customer_id', custId)
      if (error) console.error('Supabase error (subscription deleted):', error)
      break
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const custId = invoice.customer as string
      const { error } = await db.from('subscriptions').update({ status: 'past_due' }).eq('stripe_customer_id', custId)
      if (error) console.error('Supabase error (invoice.payment_failed):', error)
      break
    }
  }

  return NextResponse.json({ received: true })
}
