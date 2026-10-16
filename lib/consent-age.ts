// Parental-consent age by country (GDPR Art. 8 digital age of consent; US COPPA = 13; UK = 13).
// Source: euConsent, "Digital Age of Consent under the GDPR" (https://euconsent.eu/digital-age-of-consent-under-the-gdpr/),
// cross-checked with GDPR Art. 8 (https://gdpr-info.eu/art-8-gdpr/): default 16, member states may lower to 13.
// Country comes from Vercel's x-vercel-ip-country header at signup; the IP itself is never stored.
export const CONSENT_AGE: Record<string, number> = {
  // EU
  AT: 14, BE: 13, BG: 14, HR: 16, CY: 14, CZ: 15, DK: 13, EE: 13, FI: 13, FR: 15, DE: 16, GR: 15, HU: 16, IE: 16,
  IT: 14, LV: 13, LT: 14, LU: 16, MT: 13, NL: 16, PL: 16, PT: 13, RO: 16, SK: 16, SI: 15, ES: 14, SE: 13,
  // EEA + UK
  IS: 13, LI: 16, NO: 13, GB: 13,
  // US (COPPA)
  US: 13,
}
export const DEFAULT_CONSENT_AGE = 13

export function consentAgeFor(country: string | null | undefined): number {
  const c = String(country ?? '').trim().toUpperCase()
  return CONSENT_AGE[c] ?? DEFAULT_CONSENT_AGE
}

/** Consent age for this request (Vercel geo header). Default 13 when unknown. */
export function consentAgeFromHeaders(h: { get(name: string): string | null }): number {
  return consentAgeFor(h.get('x-vercel-ip-country'))
}
