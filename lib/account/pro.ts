import type { SupabaseClient } from '@supabase/supabase-js'
import { centerSeatActive, centerState } from '@/lib/center'

export type SubRow = { plan?: string | null; status?: string | null } | null | undefined

export function isPaidPro(sub: SubRow): boolean {
  return sub?.plan === 'pro' && (sub?.status === 'active' || sub?.status === 'trialing')
}

export function isCompActive(compProUntil: string | null | undefined, now = Date.now()): boolean {
  return !!compProUntil && new Date(compProUntil).getTime() > now
}

/** Server-side plan resolution: Pro if paid Pro OR comp_pro_until > now(). Use the service-role client. */
export async function resolvePro(db: SupabaseClient, userId: string) {
  const [{ data: sub }, { data: prof }] = await Promise.all([
    db.from('subscriptions').select('plan, status, current_period_end').eq('user_id', userId).maybeSingle(),
    db.from('user_profiles').select('comp_pro_until, comp_reason, bonus_pro_until, signup_bonus_at').eq('user_id', userId).maybeSingle(),
  ])
  // A center's paid Center Starter seat counts as paid Pro for its pilot accounts.
  const paidSeat = await centerSeatActive(db, userId, prof?.comp_reason as string | null)
  const paid = isPaidPro(sub) || paidSeat
  const center = await centerState(db, userId, prof as any, paidSeat)
  const comp = isCompActive(prof?.comp_pro_until)
  // Free bonus Pro (signup bonus + referral days). No card, no Stripe; lapses back to Free on its own.
  const bonus = isCompActive(prof?.bonus_pro_until)
  const bonusProUntil = (prof?.bonus_pro_until as string | null) ?? null
  return {
    isPro: paid || comp || bonus, paid, comp, bonus, bonusProUntil,
    bonusEnded: !paid && !comp && !bonus && !!bonusProUntil,
    compProUntil: (prof?.comp_pro_until as string | null) ?? null, sub,
    /** 'active' = Pro via center (no buy button); 'ended' = center trial over (no buy button, no free week). */
    center,
  }
}
