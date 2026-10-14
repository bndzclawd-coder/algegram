// Server-only helpers for the first-touch attribution cookie (ag_attr).
// PRIVACY RULE: attribution is for internal signup/upgrade source reporting only. Never send it to
// ad platforms (Meta pixel, Google Ads, TikTok, etc.) and never use it for retargeting (COPPA).
import { cookies } from 'next/headers'
import { ATTR_COOKIE, decodeAttribution, encodeAttribution, type Attribution } from './attribution'

export function readAttribution(): Attribution | null {
  return decodeAttribution(cookies().get(ATTR_COOKIE)?.value)
}

/** Short source label: explicit ?ref= wins, then utm_source. */
export function attributionLabel(a: Attribution | null): string | null {
  return a?.ref ?? a?.utm_source ?? null
}

type ServiceDb = { from: (t: string) => any }

/**
 * Store first-touch attribution for a newly confirmed user. Writes to public.user_attribution
 * (see supabase/migrations/20261011000000_growth_attribution.sql). Insert-only: an existing row
 * is never overwritten, so the first source sticks. Never throws: if the migration hasn't been
 * applied yet the error is logged and signup continues normally.
 */
export async function recordSignupAttribution(db: ServiceDb, userId: string, explicit?: Attribution | null): Promise<void> {
  const a = explicit !== undefined ? explicit : readAttribution()
  if (!a) return
  try {
    const { error } = await db
      .from('user_attribution')
      .upsert(
        { user_id: userId, signup_ref: attributionLabel(a), signup_attribution: a },
        { onConflict: 'user_id', ignoreDuplicates: true }
      )
    if (error) console.error('[attribution] could not store signup attribution', { code: error.code })
  } catch (e) {
    console.error('[attribution] could not store signup attribution', { name: (e as Error)?.name })
  }
}

/** Cleaned attribution as a compact string, to carry through flows that finish on another device
 *  (e.g. parental consent approved on the parent's phone). Labels only, no personal data. */
export function attributionForToken(): string | undefined {
  const a = readAttribution()
  return a ? encodeAttribution(a) : undefined
}

export function attributionFromToken(raw: unknown): Attribution | null {
  return typeof raw === 'string' ? decodeAttribution(raw) : null
}
