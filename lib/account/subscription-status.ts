import { stripe } from '@/lib/stripe'
import { SITE_URL } from '@/lib/site-config'

export const LIVE_STATUSES = new Set(['active', 'trialing'])

/**
 * True if the customer already has an active or trialing subscription. Checks our DB row and,
 * because the webhook can lag behind checkout, Stripe itself.
 */
export async function hasLiveSubscription(_dbStatus: string | null | undefined, customerId: string | null | undefined): Promise<boolean> {
  // Stripe is the only source of truth. Our subscriptions row says status 'active' even for Free
  // accounts, and a customer record, bonus, comp or pilot grant never counts as subscribed.
  if (!customerId) return false
  const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 10 })
  return subs.data.some(s => LIVE_STATUSES.has(s.status))
}

export async function portalUrl(customerId: string, returnPath = '/settings'): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${SITE_URL}${returnPath}`,
  })
  return session.url
}
