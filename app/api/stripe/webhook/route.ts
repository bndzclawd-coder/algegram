import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

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
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata.supabase_user_id
      if (!userId) break

      await db.from('subscriptions').upsert({
        user_id: userId,
        stripe_subscription_id: sub.id,
        plan: sub.status === 'active' ? 'pro' : 'free',
        status: sub.status,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      }, { onConflict: 'user_id' })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata.supabase_user_id
      if (!userId) break

      await db.from('subscriptions').update({
        plan: 'free',
        status: 'canceled',
        stripe_subscription_id: null,
      }).eq('user_id', userId)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const custId = invoice.customer as string
      await db.from('subscriptions').update({ status: 'past_due' }).eq('stripe_customer_id', custId)
      break
    }
  }

  return NextResponse.json({ received: true })
}
