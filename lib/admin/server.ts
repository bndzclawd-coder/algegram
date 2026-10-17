// Server-only data loader for /admin/signups. Uses the service role; callers MUST check
// isAdminUser() first. Never logs row data, never caches (service client fetches are no-store).
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdminUser, type RawSignup } from './signups'

/** The signed-in owner, or null (callers answer null with a 404). */
export async function getAdminUser() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return isAdminUser(user) ? user : null
  } catch {
    return null
  }
}

export async function loadRawSignups(): Promise<RawSignup[]> {
  const db = createServiceClient()
  const users: any[] = []
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error('admin: listUsers failed')
    const batch = data?.users ?? []
    users.push(...batch)
    if (batch.length < 1000) break
  }
  const [prof, attr, seats, subs] = await Promise.all([
    db.from('user_profiles').select('user_id, birth_year, comp_pro_until, comp_reason, bonus_pro_until'),
    db.from('user_attribution').select('user_id, signup_ref, signup_attribution'),
    db.from('center_seats').select('user_id, center_slug'),
    db.from('subscriptions').select('user_id, plan, status, current_period_end'),
  ])
  const by = <T extends { user_id: string }>(rows: T[] | null) => new Map((rows ?? []).map(r => [r.user_id, r]))
  const P = by(prof.data as any), A = by(attr.data as any), S = by(seats.data as any), B = by(subs.data as any)
  return users.map(u => {
    const p: any = P.get(u.id) ?? {}, a: any = A.get(u.id) ?? {}, s: any = S.get(u.id), b: any = B.get(u.id)
    return {
      id: u.id, email: u.email ?? null, created_at: u.created_at, email_confirmed_at: u.email_confirmed_at ?? null,
      user_metadata: u.user_metadata ?? null,
      birth_year: p.birth_year ?? null, comp_pro_until: p.comp_pro_until ?? null, comp_reason: p.comp_reason ?? null,
      bonus_pro_until: p.bonus_pro_until ?? null,
      signup_ref: a.signup_ref ?? null, signup_attribution: a.signup_attribution ?? null,
      seat_slug: s?.center_slug ?? null,
      sub_plan: b?.plan ?? null, sub_status: b?.status ?? null, sub_period_end: b?.current_period_end ?? null,
    }
  })
}

/** One user's revealable email (parent's for under-13s). Owner-checked by the caller. */
export async function loadRawSignup(id: string): Promise<RawSignup | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const db = createServiceClient()
  const { data } = await db.auth.admin.getUserById(id)
  const u: any = data?.user
  if (!u) return null
  const { data: p } = await db.from('user_profiles').select('birth_year').eq('user_id', id).maybeSingle()
  return { id: u.id, email: u.email ?? null, created_at: u.created_at, user_metadata: u.user_metadata ?? null, birth_year: (p as any)?.birth_year ?? null }
}
