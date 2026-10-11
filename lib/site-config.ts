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
