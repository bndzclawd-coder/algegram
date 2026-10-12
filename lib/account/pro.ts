import type { SupabaseClient } from '@supabase/supabase-js'

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
    db.from('user_profiles').select('comp_pro_until').eq('user_id', userId).maybeSingle(),
  ])
  const paid = isPaidPro(sub)
  const comp = isCompActive(prof?.comp_pro_until)
  return { isPro: paid || comp, paid, comp, compProUntil: (prof?.comp_pro_until as string | null) ?? null, sub }
}
