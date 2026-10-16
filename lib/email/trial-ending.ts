// Day-5 "trial ending" email: Pro (signup bonus or Stripe trial) ends in about 2 days.
// Once per account. Under-13: parent email only. Stats only (counts) - no names, no chat or question text.
// Disabled until NEXT_PUBLIC_MAILBOX_LIVE=true (replies go to support@).
import { Resend } from 'resend'
import { MAILBOX_LIVE, SITE_URL, PRO_PRICE_TEXT } from '@/lib/site-config'
import { isUnder13, unsubscribeUrl, type AuthUserLike } from '@/lib/email/lifecycle'

export const trialEndingEnabled = () => MAILBOX_LIVE === true
const FROM = process.env.LIFECYCLE_FROM ?? 'Algegram <support@algegram.xyz>'

export type WeekStats = { questions: number; practiceSets: number; practiceQuestions: number; activeDays: number }

export function trialEndingEmail(o: { child: boolean; stats: WeekStats; endsOn: string; paidTrial: boolean; unsubscribe: string }) {
  const { stats } = o
  const empty = !stats.questions && !stats.practiceSets
  const who = o.child ? 'your child' : 'you'
  const statLines = empty
    ? [`No questions this week yet. That's fine: ${o.child ? 'they' : 'you'} can jump back in any time before Pro ends.`]
    : [
        `Questions asked: ${stats.questions}`,
        `Practice sets finished: ${stats.practiceSets} (${stats.practiceQuestions} practice questions)`,
        `Days active: ${stats.activeDays} of the last 7`,
      ]
  const subject = o.child ? 'Your child’s free Algegram Pro ends in 2 days' : 'Your free Algegram Pro ends in 2 days'
  const action = o.paidTrial
    ? `Your free trial ends on ${o.endsOn}. After that Pro continues at ${PRO_PRICE_TEXT} unless you cancel in Settings → Manage billing.`
    : `Free Pro ends on ${o.endsOn}. After that the account goes back to Free on its own and nothing is charged. To keep Pro: ${SITE_URL}/upgrade (${PRO_PRICE_TEXT}, 7-day free trial).`
  const text = [
    'Hi,', '',
    `Here's what ${who} did with Algegram Pro in the last 7 days:`, '',
    ...statLines.map(l => `- ${l}`), '',
    action, '',
    'Questions? Reply to this email or write to support@algegram.xyz.', '',
    'Algegram', '',
    `Unsubscribe from these emails: ${o.unsubscribe}`,
  ].join('\n')
  return { subject, text }
}

export async function sendTrialEnding(u: AuthUserLike, stats: WeekStats, endsAt: string, paidTrial: boolean) {
  if (!trialEndingEnabled()) return { skipped: 'disabled' as const }
  const child = isUnder13(u)
  const to = child ? u.user_metadata?.parent_email : u.email
  if (!to) return { skipped: 'no_recipient' as const }
  const endsOn = new Date(endsAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/Los_Angeles' })
  const unsub = unsubscribeUrl(u.id)
  const t = trialEndingEmail({ child, stats, endsOn, paidTrial, unsubscribe: unsub })
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: FROM, to, replyTo: 'support@algegram.xyz', subject: t.subject, text: t.text,
    headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
  } as any)
  return error ? { error: error.name } : { sent: true as const }
}
