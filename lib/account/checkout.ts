import { stripe } from '@/lib/stripe'
import { TRIAL_DAYS } from '@/lib/site-config'
import { hasLiveSubscription, portalUrl } from '@/lib/account/subscription-status'
import { attributionLabel, readAttribution } from '@/lib/attribution/server'
import { isChildAccount } from '@/lib/account/age-gate'
import { resolvePro } from '@/lib/account/pro'
import { hadStripeSubscription } from '@/lib/account/trial'

type Db = { from: (t: string) => any }
export type CheckoutResult =
  | { kind: 'checkout' | 'portal'; url: string }
  | { kind: 'child' }
  | { kind: 'center'; state: 'active' | 'ended' }
  | { kind: 'error'; status: number; error: string }

/** Single source of truth for starting Pro: STRIPE_PRO_PRICE_ID ($12.99/mo). TRIAL_DAYS trial only if the person never had a Stripe subscription. */
export async function startProCheckout(db: Db, user: { id: string; email?: string | null; user_metadata?: any }): Promise<CheckoutResult> {
  // Under-13 accounts can never open Stripe checkout.
  if (await isChildAccount(db, user)) return { kind: 'child' }
  // Center seats never buy individually: active seats have Pro via the center; ended pilots ask their teacher.
  const center = (await resolvePro(db as any, user.id)).center
  if (center) return { kind: 'center', state: center }

  const { data: sub, error: subError } = await db.from('subscriptions').select('stripe_customer_id, status').eq('user_id', user.id).single()
  if (subError && subError.code !== 'PGRST116') {
    console.error('[checkout] subscription lookup failed', { code: subError.code })
    return { kind: 'error', status: 500, error: 'Database error' }
  }
  try {
    if (await hasLiveSubscription(sub?.status, sub?.stripe_customer_id)) {
      return { kind: 'portal', url: await portalUrl(sub!.stripe_customer_id!, '/pricing') }
    }
  } catch (err: any) {
    console.error('[checkout] subscription check failed', { type: err?.type, code: err?.code })
    return { kind: 'error', status: 503, error: 'Could not check your subscription. Please try again.' }
  }

  let trial = true
  try {
    trial = !(await hadStripeSubscription([sub?.stripe_customer_id], user.email))
  } catch (err: any) {
    console.error('[checkout] trial check failed', { type: err?.type, code: err?.code })
    return { kind: 'error', status: 503, error: 'Could not check your subscription. Please try again.' }
  }

  let customerId = sub?.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email ?? undefined, metadata: { supabase_user_id: user.id } })
    customerId = customer.id
    const { error: upsertError } = await db.from('subscriptions').upsert({ user_id: user.id, stripe_customer_id: customerId }, { onConflict: 'user_id' })
    if (upsertError) {
      console.error('[checkout] customer upsert failed', { code: upsertError.code })
      return { kind: 'error', status: 500, error: 'Database error' }
    }
  }

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
    subscription_data: { ...(trial ? { trial_period_days: TRIAL_DAYS } : {}), metadata: { supabase_user_id: user.id, ...refMeta } },
    managed_payments: { enabled: false },
  } as any)
  return { kind: 'checkout', url: session.url! }
}
