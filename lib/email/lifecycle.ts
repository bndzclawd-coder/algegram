// Lifecycle emails (welcome + daily-limit) via the app's existing Resend account.
// Everything is a no-op unless LIFECYCLE_EMAILS_ENABLED === "true"
// (keep it off until support@algegram.xyz receives mail).
import { createHmac, timingSafeEqual } from 'crypto'
import { Resend } from 'resend'
import { SITE_URL } from '@/lib/site-config'
import { welcomeEmail, dailyLimitEmail } from './templates'

const FROM = process.env.LIFECYCLE_FROM ?? 'Algegram <support@algegram.xyz>'
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export const lifecycleEnabled = () => process.env.LIFECYCLE_EMAILS_ENABLED === 'true'

// Lazy so a missing key never crashes a build or a request that doesn't send mail.
let _resend: Resend | null = null
function resend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

type ServiceDb = { from: (t: string) => any }

/** Minimal view of a Supabase auth user. */
export type AuthUserLike = { id: string; email?: string | null; user_metadata?: Record<string, any> | null }

/** Under-13 = created through the parental-consent flow, or birth year says so. */
export function isUnder13(u: AuthUserLike): boolean {
  const m = u.user_metadata ?? {}
  if (m.parental_consent === true) return true
  const by = Number(m.birth_year)
  return Number.isFinite(by) && by > 0 && new Date().getFullYear() - by < 13
}

// ── Unsubscribe tokens (HMAC of user id; no expiry, single purpose) ──────────
function unsubSecret() {
  return process.env.LIFECYCLE_UNSUB_SECRET || process.env.GUEST_COOKIE_SECRET || ''
}
export function unsubscribeToken(userId: string): string {
  return createHmac('sha256', unsubSecret()).update(`unsub:${userId}`).digest('hex')
}
export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  if (!unsubSecret() || !/^[0-9a-f]{64}$/.test(token)) return false
  return timingSafeEqual(Buffer.from(unsubscribeToken(userId), 'hex'), Buffer.from(token, 'hex'))
}
export function unsubscribeUrl(userId: string) {
  return `${SITE_URL}/api/email/unsubscribe?u=${encodeURIComponent(userId)}&t=${unsubscribeToken(userId)}`
}

/**
 * Welcome email. Call once after email confirmation.
 * Under-13 accounts: account-only wording, no Pro pitch, sent to the PARENT email.
 */
export async function sendWelcomeEmail(u: AuthUserLike) {
  if (!lifecycleEnabled()) return { skipped: 'disabled' as const }
  const child = isUnder13(u)
  const to = child ? u.user_metadata?.parent_email : u.email
  if (!to) return { skipped: 'no_recipient' as const }
  if (child && u.user_metadata?.parental_consent !== true) return { skipped: 'no_consent' as const }
  const t = welcomeEmail({ firstName: null, accountOnly: child })
  return checked('welcome', await resend().emails.send({ from: FROM, to, subject: t.subject, text: t.text, html: t.html }))
}

/**
 * Daily-limit email. Call when a signed-in Free user uses their last free question today.
 * Promotional: never for under-13, respects opt-out, max once per 7 days.
 * last_limit_email_at is written BEFORE sending so concurrent requests can't double-send.
 */
export async function maybeSendDailyLimitEmail(db: ServiceDb, u: AuthUserLike) {
  if (!lifecycleEnabled()) return { skipped: 'disabled' as const }
  if (isUnder13(u)) return { skipped: 'under13' as const }
  if (!u.email) return { skipped: 'no_recipient' as const }

  const { data: row, error } = await db
    .from('user_attribution')
    .select('marketing_opt_out, last_limit_email_at')
    .eq('user_id', u.id)
    .maybeSingle()
  if (error) {
    console.error('[lifecycle] state lookup failed', { code: error.code })
    return { skipped: 'no_state' as const }
  }
  if (row?.marketing_opt_out) return { skipped: 'opted_out' as const }
  if (row?.last_limit_email_at && Date.now() - new Date(row.last_limit_email_at).getTime() < WEEK_MS)
    return { skipped: 'rate_limited' as const }

  const { error: markErr } = await db
    .from('user_attribution')
    .upsert({ user_id: u.id, last_limit_email_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (markErr) {
    console.error('[lifecycle] could not mark limit email', { code: markErr.code })
    return { skipped: 'no_state' as const }
  }

  const unsub = unsubscribeUrl(u.id)
  const t = dailyLimitEmail({ firstName: null, resetTimeText: 'at midnight UTC', unsubscribeUrl: unsub })
  return checked('daily-limit', await resend().emails.send({
    from: FROM, to: u.email, subject: t.subject, text: t.text, html: t.html,
    headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
  }))
}

/** The Resend SDK returns { error } instead of throwing. Turn that into a failure; log the error name only. */
function checked(kind: string, r: { data: unknown; error: { name?: string } | null }) {
  if (r.error) {
    console.error('[lifecycle] email send failed', { kind, name: r.error.name })
    return { sent: false as const, error: r.error.name ?? 'error' }
  }
  return { sent: true as const }
}
