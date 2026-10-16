// Year-only birth dates: use the YOUNGEST possible age (birthday not yet reached this year),
// so a child can never be classed as 13+ by rounding.
export function parseBirthYear(v: unknown): number | null {
  const n = typeof v === 'number' ? v : parseInt(String(v ?? ''), 10)
  const y = new Date().getUTCFullYear()
  return Number.isInteger(n) && n >= 1900 && n <= y ? n : null
}
export function minAge(birthYear: number): number {
  return new Date().getUTCFullYear() - birthYear - 1
}
/** Needs a parent's approval under this country's consent age (13 to 16; 13 = COPPA default). */
export function needsParent(birthYear: number, consentAge = 13): boolean {
  return minAge(birthYear) < consentAge
}
export function isUnder13(birthYear: number): boolean {
  return minAge(birthYear) < 13
}
export const EMAIL_RE = /^[^\s@<>"']{1,64}@[^\s@<>"']{1,190}\.[a-z]{2,}$/i
export function escapeHtml(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
