// Pro weekly progress report. Built at send time from practice_results (topic + score only).
// No-op unless LIFECYCLE_EMAILS_ENABLED=true AND WEEKLY_REPORTS_ENABLED=true.
import { createHmac, timingSafeEqual } from 'crypto'
import { Resend } from 'resend'
import { SITE_URL } from '@/lib/site-config'
import { lifecycleEnabled, isUnder13, type AuthUserLike } from './lifecycle'
import type { WeeklySummary } from '@/lib/practice/weakspots'

const FROM = process.env.LIFECYCLE_FROM ?? 'Algegram <noreply@algegram.xyz>'
export const weeklyEnabled = () => lifecycleEnabled() && process.env.WEEKLY_REPORTS_ENABLED === 'true'

let _resend: Resend | null = null
const resend = () => (_resend ??= new Resend(process.env.RESEND_API_KEY))

const secret = () => process.env.LIFECYCLE_UNSUB_SECRET || process.env.GUEST_COOKIE_SECRET || ''
export const weeklyUnsubToken = (userId: string) => createHmac('sha256', secret()).update(`weekly:${userId}`).digest('hex')
export function verifyWeeklyUnsubToken(userId: string, token: string) {
  if (!secret() || !/^[0-9a-f]{64}$/.test(token)) return false
  return timingSafeEqual(Buffer.from(weeklyUnsubToken(userId), 'hex'), Buffer.from(token, 'hex'))
}
export const weeklyUnsubUrl = (userId: string) =>
  `${SITE_URL}/api/email/unsubscribe?k=weekly&u=${encodeURIComponent(userId)}&t=${weeklyUnsubToken(userId)}`

/** Recipient: adults get it at their own address; under-13 ONLY at the consenting parent's address. */
export function weeklyRecipient(u: AuthUserLike): string | null {
  if (isUnder13(u)) {
    if (u.user_metadata?.parental_consent !== true) return null
    return typeof u.user_metadata?.parent_email === 'string' ? u.user_metadata.parent_email : null
  }
  return u.email ?? null
}

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
const arrow = (pct: number, prev: number | null) => prev === null ? 'new' : pct > prev ? `up from ${prev}%` : pct < prev ? `down from ${prev}%` : 'same as last week'

export function weeklyEmail(s: WeeklySummary, o: { parent: boolean; unsubscribeUrl: string }) {
  const who = o.parent ? 'your child' : 'you'
  const subject = o.parent ? "Your child's Algegram week" : 'Your Algegram week'
  const head = `This week ${who} finished ${s.sets} practice set${s.sets === 1 ? '' : 's'} (${s.questions} questions) and got ${s.pct}% right` +
    (s.prevPct !== null ? ` (${arrow(s.pct ?? 0, s.prevPct)}).` : '.')
  const lines = s.topics.map(t => `${t.label}: ${t.score}/${t.total} (${t.pct}%, ${arrow(t.pct, t.prevPct)})`)
  const next = s.weakest ? `Suggested next: ${s.weakest.label} weak-spot practice.` : 'No weak spots right now. Nice work!'
  const practice = `${SITE_URL}/practice`
  const foot = `Only topic names and scores are used for this report. Turn it off: ${o.unsubscribeUrl} · Settings: ${SITE_URL}/settings · Privacy: ${SITE_URL}/privacy`
  const text = ['Hi there,', '', head, '', ...lines, '', next, practice, '', 'The Algegram team', foot].join('\n')
  const P = (x: string) => `<p style="margin:0 0 14px;line-height:1.6">${x}</p>`
  const html = `<div style="font-family:system-ui,sans-serif;max-width:560px;color:#111">` +
    P('Hi there,') + P(esc(head)) +
    `<ul style="margin:0 0 14px;padding-left:20px;line-height:1.7">${lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul>` +
    P(`${esc(next)} <a href="${practice}" style="color:#6c63ff;font-weight:600">Practice now</a>`) + P('The Algegram team') +
    `<p style="font-size:12px;color:#666">Only topic names and scores are used for this report. <a href="${o.unsubscribeUrl}">Turn off weekly reports</a> · <a href="${SITE_URL}/settings">Settings</a> · <a href="${SITE_URL}/privacy">Privacy</a></p></div>`
  return { subject, text, html }
}

export async function sendWeeklyReport(u: AuthUserLike, s: WeeklySummary) {
  const to = weeklyRecipient(u)
  if (!to) return { skipped: 'no_recipient' as const }
  const unsub = weeklyUnsubUrl(u.id)
  const t = weeklyEmail(s, { parent: isUnder13(u), unsubscribeUrl: unsub })
  const r = await resend().emails.send({
    from: FROM, to, subject: t.subject, text: t.text, html: t.html,
    headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
  })
  return r.error ? { error: r.error.message } : { sent: true as const }
}
