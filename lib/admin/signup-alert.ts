// Internal "New real signup" alert to support@. Reuses the /admin/signups real-vs-test rules.
// PRIVACY: the email carries only the PT time, account type, a generic source and the admin link.
// No names, emails, kid details, IPs, or company/center names. Errors are logged generically.
import { buildRows, type RawSignup, type AccountType } from './signups'

export const ADMIN_SIGNUPS_URL = 'https://www.algegram.xyz/admin/signups'
export const ALERT_SUBJECT = 'New real signup'

const SOCIAL = /^(instagram|ig|facebook|fb|tiktok|youtube|yt|x|twitter|reddit|linkedin|threads|pinterest|snapchat|social)$/

/** Generic "how they found us": no platform, company or center names. */
export function alertSource(r: RawSignup): string {
  const a = (r.signup_attribution ?? {}) as Record<string, unknown>
  const src = String(a.utm_source ?? r.signup_ref ?? '').toLowerCase()
  const med = String(a.utm_medium ?? '').toLowerCase()
  if (r.seat_slug || /^pilot:/.test(r.comp_reason ?? '') || src === 'pilot') return 'Center link'
  let kind: string
  if (a.ref || src === 'referral') kind = 'Referral link'
  else if (src === 'seo' || med === 'organic') kind = 'Search'
  else if (src === 'referrer') kind = 'Another website'
  else if (SOCIAL.test(src) || med === 'social') kind = 'Social post'
  else if (src === 'email' || med === 'email') kind = 'Email'
  else if (src) kind = 'Campaign link'
  else return 'Direct'
  const camp = typeof a.utm_campaign === 'string' && /^[a-z0-9_-]{1,40}$/.test(a.utm_campaign) ? a.utm_campaign : null
  return camp ? `${kind} (campaign: ${camp})` : kind
}

export function buildSignupAlert(o: { createdPt: string; type: AccountType; source: string }) {
  const text = [
    ALERT_SUBJECT,
    '',
    `When: ${o.createdPt}`,
    `Account type: ${o.type}`,
    `How they found us: ${o.source}`,
    '',
    `Details: ${ADMIN_SIGNUPS_URL}`,
  ].join('\n')
  return { subject: ALERT_SUBJECT, text }
}

/** One alert per family: the parent's email for under-13s, else the account's own (or id). */
export function familyKey(r: RawSignup, kid: boolean): string {
  const parent = String(r.user_metadata?.parent_email ?? '').trim().toLowerCase()
  const own = String(r.email ?? '').trim().toLowerCase()
  return kid && parent ? `email:${parent}` : own ? `email:${own}` : `id:${r.id}`
}

export type AlertDeps = {
  /** Atomic once-only claim of the hashed family key. */
  claim: (key: string) => Promise<'claimed' | 'used' | 'error'>
  send: (msg: { subject: string; text: string }) => Promise<void>
  logError?: (msg: string) => void
}

export type AlertOutcome = 'sent' | 'skipped_test' | 'skipped_owner' | 'duplicate' | 'claim_error' | 'send_error'

/** Never throws. Test/owner accounts never claim or send. */
export async function maybeSendSignupAlert(r: RawSignup, deps: AlertDeps, now = new Date()): Promise<AlertOutcome> {
  const log = deps.logError ?? ((m: string) => console.error(m))
  try {
    const [row] = buildRows([r], now)
    if (row.flag === 'test') return 'skipped_test'
    if (row.flag === 'owner') return 'skipped_owner'
    const c = await deps.claim(familyKey(r, row.type === 'kid'))
    if (c === 'used') return 'duplicate'
    if (c === 'error') { log('[signup-alert] could not record alert'); return 'claim_error' }
    await deps.send(buildSignupAlert({ createdPt: row.createdPt, type: row.type, source: alertSource(r) }))
    return 'sent'
  } catch {
    log('[signup-alert] send failed')
    return 'send_error'
  }
}
