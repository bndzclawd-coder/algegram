import { isUnder13 as metaUnder13, type AuthUserLike } from '@/lib/email/lifecycle'

type Db = { from: (t: string) => any }

/** Server-side under-13 check: auth metadata (consent flow / birth year) OR the verified profile record. */
export async function isChildAccount(db: Db, user: AuthUserLike): Promise<boolean> {
  if (metaUnder13(user)) return true
  const { data } = await db.from('user_profiles').select('birth_year, parental_consent').eq('user_id', user.id).maybeSingle()
  if (data?.parental_consent === true) return true
  const by = Number(data?.birth_year)
  return Number.isFinite(by) && by > 0 && new Date().getFullYear() - by < 13
}
