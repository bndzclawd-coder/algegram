// Center Starter: a center's paid subscription turns its pilot seats (user_profiles.comp_reason
// 'pilot:<slug>') into paid Pro, up to `seats` accounts (oldest first). Server-only.
import type Stripe from 'stripe'

type Db = { from: (t: string) => any; auth: { admin: { listUsers: (o: any) => Promise<any> } } }

export const CENTER_PLAN = 'center_starter'
export const LIVE = new Set(['active', 'trialing'])

export function centerSlug(name: string | null | undefined): string | null {
  const s = String(name ?? '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
  return s || null
}

/** Pilot slug variants we accept (comp_reason uses '-' or '_'). */
function variants(slug: string) {
  return Array.from(new Set([slug, slug.replace(/-/g, "_"), slug.replace(/-/g, "")]))
}

async function slugFromCenterName(db: Db, name: string | null): Promise<string | null> {
  const slug = centerSlug(name)
  if (!slug) return null
  for (const v of variants(slug)) {
    const { data } = await db.from('user_profiles').select('user_id').eq('comp_reason', `pilot:${v}`).limit(1)
    if (data?.length) return v
  }
  return null
}

async function slugFromPayerEmail(db: Db, email: string | null): Promise<string | null> {
  const e = String(email ?? '').trim().toLowerCase()
  if (!e) return null
  // Find the auth user with this email (paged admin list), then use their pilot slug.
  for (let page = 1; page <= 20; page++) {
    const { data } = await db.auth.admin.listUsers({ page, perPage: 1000 })
    const users = data?.users ?? []
    const u = users.find((x: any) => String(x.email ?? '').toLowerCase() === e)
    if (u) {
      const { data: p } = await db.from('user_profiles').select('comp_reason').eq('user_id', u.id).maybeSingle()
      const m = /^pilot:([a-z0-9_-]{1,64})$/.exec(p?.comp_reason ?? '')
      return m ? m[1] : null
    }
    if (users.length < 1000) break
  }
  return null
}

/** Minimal subscription view from the session alone, used when Stripe can't return the subscription
 *  (not yet visible, or not found). Paid sessions count as active for one period; otherwise incomplete. */
export function subscriptionFromSession(s: Stripe.Checkout.Session): Stripe.Subscription {
  return {
    id: String(s.subscription),
    customer: s.customer as string,
    status: s.payment_status === 'paid' || s.payment_status === 'no_payment_required' ? 'active' : 'incomplete',
    current_period_end: Math.floor(Date.now() / 1000) + 31 * 24 * 3600,
    metadata: { ...(s.metadata ?? {}) },
  } as unknown as Stripe.Subscription
}

export function isCenterSub(sub: Stripe.Subscription | null | undefined, session?: Stripe.Checkout.Session | null) {
  return sub?.metadata?.plan === CENTER_PLAN || session?.metadata?.plan === CENTER_PLAN
}

/** Upsert the center subscription; match it to a pilot center by center name, else payer email. */
export async function syncCenterSubscription(db: Db, sub: Stripe.Subscription, session?: Stripe.Checkout.Session | null) {
  const centerName = session?.custom_fields?.find(f => f.key === 'center_name')?.text?.value ?? sub.metadata?.center_name ?? null
  const payerEmail = session?.customer_details?.email ?? null
  const { data: existing } = await db.from('center_subscriptions').select('center_slug, matched').eq('stripe_subscription_id', sub.id).maybeSingle()
  let slug: string | null = existing?.center_slug ?? null
  let method: string | null = null
  if (!slug) { slug = await slugFromCenterName(db, centerName); if (slug) method = 'center_name' }
  if (!slug) { slug = await slugFromPayerEmail(db, payerEmail); if (slug) method = 'payer_email' }
  const seats = Math.max(1, Math.min(500, parseInt(String(sub.metadata?.seats ?? session?.metadata?.seats ?? '10'), 10) || 10))
  const row: Record<string, unknown> = {
    stripe_subscription_id: sub.id,
    stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
    center_slug: slug, seats, status: sub.status,
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    matched: !!slug, updated_at: new Date().toISOString(),
    ...(method ? { match_method: method } : {}),
  }
  const { error } = await db.from('center_subscriptions').upsert(row, { onConflict: 'stripe_subscription_id' })
  if (error) console.error('[center] upsert failed', { code: error.code })
  // Flag for the team: logged without names or emails; the row is kept with matched=false.
  if (!slug) console.error('[center] UNMATCHED Center Starter subscription', { subscription: sub.id, hasCenterName: !!centerName, hasPayerEmail: !!payerEmail })
  else console.log('[center] synced', { subscription: sub.id, slug, method: method ?? 'existing', status: sub.status })
}

/** Is this pilot account covered by a live Center Starter seat? */
export async function centerSeatActive(db: { from: (t: string) => any }, userId: string, compReason: string | null | undefined): Promise<boolean> {
  const m = /^pilot:([a-z0-9_-]{1,64})$/.exec(compReason ?? '')
  if (!m) return false
  const { data: subs } = await db.from('center_subscriptions').select('seats, status, current_period_end')
    .eq('center_slug', m[1]).in('status', ['active', 'trialing']).gt('current_period_end', new Date().toISOString())
  const seats = (subs ?? []).reduce((n: number, s: any) => n + (s.seats ?? 0), 0)
  if (!seats) return false
  const { data: members } = await db.from('user_profiles').select('user_id').eq('comp_reason', compReason).order('created_at', { ascending: true }).limit(seats)
  return (members ?? []).some((r: any) => r.user_id === userId)
}

/**
 * Center seat state for the buy-button rules.
 * Detection: a seat came via a center if user_profiles.comp_reason = 'pilot:<slug>' (center pilot link)
 * or the account has a row in public.center_seats. 'active' = pilot Pro still running (comp_pro_until > now)
 * or the center pays Center Starter and this account holds one of its seats. Otherwise 'ended'.
 */
export async function centerState(
  db: { from: (t: string) => any }, userId: string,
  prof: { comp_reason?: string | null; comp_pro_until?: string | null } | null | undefined,
  paidSeat: boolean,
): Promise<'active' | 'ended' | null> {
  const pilot = /^pilot:([a-z0-9_-]{1,64})$/.exec(prof?.comp_reason ?? '')
  let seatSlug: string | null = null
  if (!pilot) {
    const { data } = await db.from('center_seats').select('center_slug').eq('user_id', userId).maybeSingle()
    seatSlug = data?.center_slug ?? null
    if (!seatSlug) return null
  }
  if (paidSeat) return 'active'
  if (prof?.comp_pro_until && new Date(prof.comp_pro_until).getTime() > Date.now()) return 'active'
  if (seatSlug) {
    const { data: subs } = await db.from('center_subscriptions').select('seats')
      .eq('center_slug', seatSlug).in('status', ['active', 'trialing']).gt('current_period_end', new Date().toISOString())
    if ((subs ?? []).some((s: any) => (s.seats ?? 0) > 0)) return 'active'
  }
  return 'ended'
}
