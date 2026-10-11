import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'

type Db = { from: (t: string) => any }
const COLLECTING = new Set(['active', 'trialing', 'past_due'])

async function activeSubscription(db: Db, userId: string): Promise<{ id: string } | null | 'error'> {
  const { data, error } = await db.from('subscriptions').select('stripe_subscription_id, status').eq('user_id', userId).maybeSingle()
  if (error && error.code !== '42P01') return 'error'
  if (!data?.stripe_subscription_id || !COLLECTING.has(String(data.status))) return null
  return { id: data.stripe_subscription_id }
}

/** Pause Stripe collection (invoices are voided) for a paused under-13 account. */
export async function pauseBilling(db: Db, userId: string): Promise<'paused' | 'none' | 'error'> {
  const sub = await activeSubscription(db, userId)
  if (sub === 'error') return 'error'
  if (!sub) return 'none'
  try {
    await stripe.subscriptions.update(sub.id, { pause_collection: { behavior: 'void' } })
  } catch (err: any) {
    console.error('[billing] pause failed', { type: err?.type, code: err?.code })
    return 'error'
  }
  await db.from('user_profiles').update({ billing_paused: true }).eq('user_id', userId)
  return 'paused'
}

/** Resume Stripe collection after a parent consents. */
export async function resumeBilling(db: Db, userId: string): Promise<'resumed' | 'none' | 'error'> {
  const sub = await activeSubscription(db, userId)
  if (sub === 'error') return 'error'
  if (!sub) return 'none'
  try {
    await stripe.subscriptions.update(sub.id, { pause_collection: '' })
  } catch (err: any) {
    console.error('[billing] resume failed', { type: err?.type, code: err?.code })
    return 'error'
  }
  await db.from('user_profiles').update({ billing_paused: false }).eq('user_id', userId)
  return 'resumed'
}

/**
 * Refund the latest PAID invoice of a subscription if it covers the current period.
 * Idempotent (Stripe idempotency key per invoice; already-refunded charges are ignored).
 */
export async function refundCurrentPeriod(subscriptionId: string): Promise<'refunded' | 'none' | 'error'> {
  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId)
    const invoices = await stripe.invoices.list({ subscription: subscriptionId, status: 'paid', limit: 1 })
    const inv: Stripe.Invoice | undefined = invoices.data[0]
    if (!inv || !inv.amount_paid) return 'none'
    const periodEnd = inv.lines?.data?.[0]?.period?.end ?? 0
    if (periodEnd < sub.current_period_start + 1) return 'none' // not for the current period
    const pi = typeof inv.payment_intent === 'string' ? inv.payment_intent : inv.payment_intent?.id
    const charge = typeof inv.charge === 'string' ? inv.charge : inv.charge?.id
    if (!pi && !charge) return 'none'
    await stripe.refunds.create(
      pi ? { payment_intent: pi, reason: 'requested_by_customer' } : { charge: charge!, reason: 'requested_by_customer' },
      { idempotencyKey: `under13-refund-${inv.id}` },
    )
    return 'refunded'
  } catch (err: any) {
    if (err?.code === 'charge_already_refunded') return 'none'
    console.error('[billing] refund failed', { type: err?.type, code: err?.code })
    return 'error'
  }
}
