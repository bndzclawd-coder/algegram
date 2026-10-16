// Parent pays for an under-13 child's Pro. The Stripe customer is the PARENT (parent email only).
// The only link to the child is our opaque account id in metadata: no child name, email or age.
import jwt from 'jsonwebtoken'
import { stripe } from '@/lib/stripe'
import { TRIAL_DAYS, SITE_URL } from '@/lib/site-config'
import { hasLiveSubscription } from '@/lib/account/subscription-status'

type Db = { from: (t: string) => any; auth: { admin: { getUserById: (id: string) => Promise<any> } } }
const TYPE = 'parent-pro'

export function parentProLink(childId: string, parentEmail: string): string | null {
  const secret = process.env.CONSENT_JWT_SECRET
  if (!secret) return null
  const t = jwt.sign({ c: childId, p: parentEmail.toLowerCase(), type: TYPE }, secret, { expiresIn: '7d' })
  return `${SITE_URL}/parent/pro?t=${encodeURIComponent(t)}`
}

export async function startParentCheckout(db: Db, token: string): Promise<{ url: string } | { error: string }> {
  const secret = process.env.CONSENT_JWT_SECRET
  if (!secret) return { error: 'config' }
  let p: { c: string; p: string; type: string }
  try { p = jwt.verify(token, secret) as any; if (p.type !== TYPE) throw new Error('type') } catch { return { error: 'expired' } }

  const { data: u } = await db.auth.admin.getUserById(p.c)
  const child = u?.user
  // The link only works for the parent email still on file for that child account.
  if (!child || String(child.user_metadata?.parent_email ?? '').toLowerCase() !== p.p) return { error: 'expired' }

  const { data: sub } = await db.from('subscriptions').select('stripe_customer_id, status').eq('user_id', child.id).maybeSingle()
  if (sub?.stripe_customer_id && await hasLiveSubscription(sub.status, sub.stripe_customer_id)) return { error: 'already' }

  // Reuse the parent's customer if this child already has one; otherwise create one with the parent email.
  let customerId: string | null = sub?.stripe_customer_id ?? null
  if (customerId) {
    const c = await stripe.customers.retrieve(customerId)
    if ((c as any).deleted || String((c as any).email ?? '').toLowerCase() !== p.p) customerId = null
  }
  if (!customerId) {
    const c = await stripe.customers.create({ email: p.p, metadata: { payer: 'parent', supabase_user_id: child.id } })
    customerId = c.id
    const { error } = await db.from('subscriptions').upsert({ user_id: child.id, stripe_customer_id: customerId }, { onConflict: 'user_id' })
    if (error) { console.error('[parent-checkout] customer upsert failed', { code: error.code }); return { error: 'db' } }
  }
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    client_reference_id: child.id,
    metadata: { supabase_user_id: child.id, payer: 'parent' },
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    success_url: `${SITE_URL}/parent/pro/done`,
    cancel_url: `${SITE_URL}/pricing`,
    allow_promotion_codes: true,
    subscription_data: { trial_period_days: TRIAL_DAYS, metadata: { supabase_user_id: child.id, payer: 'parent' } },
    managed_payments: { enabled: false },
  } as any)
  return { url: session.url! }
}
