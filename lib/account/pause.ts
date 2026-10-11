export const PAUSE_DAYS = 14
export const EXISTING_CONSENT_TOKEN = 'existing-account-consent'
export function deleteAfter(pausedAt: string | Date): Date {
  return new Date(new Date(pausedAt).getTime() + PAUSE_DAYS * 24 * 60 * 60 * 1000)
}
