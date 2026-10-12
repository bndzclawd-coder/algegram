import jwt from 'jsonwebtoken'
import { EXISTING_CONSENT_TOKEN } from '@/lib/account/pause'
import { createServiceClient } from '@/lib/supabase/server'
import { tokenStatus, USED_LINK_ERROR } from '@/lib/account/consent-token'

export type ConsentVerifyResult =
  | { ok: true; status: 200; data: { childEmail: string; parentEmail: string; childBirthYear: number; existingAccount: boolean } }
  | { ok: false; status: number; error: string; used?: boolean }

/** Read-only check of a consent link: signature/expiry + single-use record. Never writes. */
export async function verifyConsentToken(token: string | null): Promise<ConsentVerifyResult> {
  if (!token) return { ok: false, status: 400, error: 'Missing consent token.' }
  const secret = process.env.CONSENT_JWT_SECRET
  if (!secret) return { ok: false, status: 500, error: 'Server config error.' }
  let payload: { childEmail: string; parentEmail: string; childBirthYear: number; type: string }
  try {
    payload = jwt.verify(token, secret) as typeof payload
    if (payload.type !== 'parental-consent' && payload.type !== EXISTING_CONSENT_TOKEN) throw new Error('Wrong token type')
  } catch {
    return { ok: false, status: 400, error: 'Link expired or invalid. Please ask the child to sign up again.' }
  }
  const status = await tokenStatus(createServiceClient(), token)
  if (status === 'used') return { ok: false, status: 410, error: USED_LINK_ERROR, used: true }
  if (status === 'error') return { ok: false, status: 503, error: 'Please try again later.' }
  return { ok: true, status: 200, data: {
    childEmail: payload.childEmail, parentEmail: payload.parentEmail, childBirthYear: payload.childBirthYear,
    existingAccount: payload.type === EXISTING_CONSENT_TOKEN,
  } }
}
