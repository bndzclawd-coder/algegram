import { stripe } from '@/lib/stripe'

/**
 * Trial rule: anyone who has EVER had a Stripe subscription (any status, incl. canceled/incomplete)
 * gets checkout with no trial. Everyone else (incl. people who only used the in-app bonus week) gets the trial.
 * Checked live against Stripe: the customer ids we know + any Stripe customers with the same email.
 * Throws on Stripe errors so callers can fail safely.
 */
export async function hadStripeSubscription(customerIds: (string | null | undefined)[], email?: string | null): Promise<boolean> {
  const ids = new Set(customerIds.filter((x): x is string => !!x))
  const e = (email ?? '').trim().toLowerCase()
  if (e) {
    const found = await stripe.customers.list({ email: e, limit: 20 })
    for (const c of found.data) ids.add(c.id)
  }
  for (const id of Array.from(ids)) {
    const subs = await stripe.subscriptions.list({ customer: id, status: 'all', limit: 1 })
    if (subs.data.length > 0) return true
  }
  return false
}
