// Single place for plan + offer wording. The Pro offer is NOT decided yet
// (free trial vs $1 first month). Leave PRO_OFFER_TEXT null until it is confirmed;
// pages and emails then show generic "Try Pro" wording only.
export const SITE_URL = 'https://www.algegram.xyz'
export const SITE_NAME = 'Algegram'
export const PRO_PRICE_TEXT = '$12.99/month'
export const PRO_CTA_TEXT = 'Try Pro'
/** e.g. "7-day free trial" or "$1 for your first month". null = no offer shown anywhere. */
export const PRO_OFFER_TEXT: string | null = null
export const GUEST_FREE_QUESTIONS = 5
export const FREE_DAILY_QUESTIONS = 20
export const PILOT_MAILTO =
  'mailto:hello@algegram.xyz?subject=' + encodeURIComponent('Algegram pilot request')

/** hello@, support@ and privacy@ mailto links stay hidden until those mailboxes receive mail. Set NEXT_PUBLIC_MAILBOX_LIVE=true to show. */
/** hello@algegram.xyz receives mail on Google Workspace (verified 2026-10-11), so it is shown regardless of MAILBOX_LIVE. */
export const HELLO_EMAIL = 'hello@algegram.xyz'
/** support@algegram.xyz (help, privacy, billing) receives mail (verified 2026-10-11), so it is shown regardless of MAILBOX_LIVE. */
export const SUPPORT_EMAIL = 'support@algegram.xyz'
export const MAILBOX_LIVE = process.env.NEXT_PUBLIC_MAILBOX_LIVE === 'true'
/** Stripe Checkout trial length (days). Keep in sync with /terms copy. */
export const TRIAL_DAYS = 7
/** /privacy and /terms show a short "being updated" notice (noindex) until the legal copy is reviewed. */
export const LEGAL_PAGES_REVIEWED = process.env.NEXT_PUBLIC_LEGAL_PAGES_REVIEWED === 'true'

/** Pro fair use: premium-model messages per account per UTC day. After this, Pro falls back to FREE_MODEL (not blocked). */
export const PRO_FAIR_USE_DAILY = 200
