// Signup bonus + referrals. Server-only. No names/emails in codes; IPs are only stored as salted hash prefixes.
import { createHash, randomBytes } from 'crypto'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { clientIp } from '@/lib/rate-limit'
import type { Attribution } from '@/lib/attribution/attribution'

export const REF_COOKIE = 'ag_ref'
export const REF_RE = /^[a-z2-9]{8}$/
export const BONUS_DAYS = 7
export const REFERRAL_CAP = 4

type Db = { from: (t: string) => any; rpc: (fn: string, args: any) => any }

export function cleanRefCode(v: unknown): string | null {
  const s = typeof v === 'string' ? v.trim().toLowerCase() : ''
  return REF_RE.test(s) ? s : null
}

export function readRefCookie(): string | null {
  try { return cleanRefCode(cookies().get(REF_COOKIE)?.value) } catch { return null }
}

export function ipHash(req: NextRequest): string | null {
  const ip = clientIp(req)
  const salt = process.env.IP_HASH_SALT || process.env.CONSENT_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!ip || ip === 'unknown' || !salt) return null
  return createHash('sha256').update(`${salt}:ip:${ip}`).digest('hex').slice(0, 32)
}

export function newCode(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789'
  const b = randomBytes(8)
  return Array.from(b, x => alphabet[x % alphabet.length]).join('')
}

export function isPilot(attr: Attribution | null | undefined): boolean {
  return attr?.utm_source === 'pilot'
}

/** Called once an account is real (email confirmed, or parent consent given). Never throws. */
export async function onAccountActivated(db: Db, userId: string, opts: { pilot: boolean }) {
  try {
    if (!opts.pilot) {
      const { error } = await db.rpc('grant_signup_bonus', { p_user_id: userId, p_days: BONUS_DAYS })
      if (error) console.error('[bonus] grant failed', { code: error.code })
    }
    const { data: prof } = await db.from('user_profiles').select('pending_ref_code, signup_ip_hash').eq('user_id', userId).maybeSingle()
    if (prof?.pending_ref_code) {
      const { data, error } = await db.rpc('award_referral', { p_referred: userId, p_code: prof.pending_ref_code, p_ip_hash: prof.signup_ip_hash ?? null })
      if (error) console.error('[referral] award failed', { code: error.code })
      else console.log('[referral] outcome', { outcome: data })
    }
  } catch (e) {
    console.error('[bonus] activation threw', { name: (e as Error)?.name })
  }
}
