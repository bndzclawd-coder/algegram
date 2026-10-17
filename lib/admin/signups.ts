// Pure helpers for the private /admin/signups page. No I/O, no logging: safe to unit test.
// PRIVACY: nothing here is logged, cached or sent to analytics. Emails never leave the server
// except through the owner-only reveal route, and for under-13s only the parent's email is shown.

/** The site owner. Override with ADMIN_EMAILS (comma-separated). Only these can open /admin. */
export const DEFAULT_ADMIN_EMAILS = ['basithcs@gmail.com']
/** The owner's own accounts (counted as owner, not real signups). Extend with ADMIN_OWNER_EMAILS. */
export const DEFAULT_OWNER_ACCOUNT_EMAILS = ['basithcs@gmail.com', 'bndzclawd@gmail.com']

function list(env: string | undefined, fallback: string[]): string[] {
  const v = (env ?? '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  return v.length ? v : fallback
}
export function adminEmails(env = process.env.ADMIN_EMAILS): string[] {
  return list(env, DEFAULT_ADMIN_EMAILS)
}
export function ownerAccountEmails(env = process.env.ADMIN_OWNER_EMAILS): string[] {
  return Array.from(new Set([...DEFAULT_OWNER_ACCOUNT_EMAILS, ...list(env, []), ...adminEmails()]))
}

/** Owner gate: a signed-in user whose confirmed email is on the allowlist. */
export function isAdminUser(user: { email?: string | null; email_confirmed_at?: string | null } | null | undefined,
  allow = adminEmails()): boolean {
  const e = String(user?.email ?? '').trim().toLowerCase()
  return !!e && !!user?.email_confirmed_at && allow.includes(e)
}

export type AccountType = 'kid' | 'parent' | 'adult' | 'center seat'
export type Flag = 'real' | 'test' | 'owner'

export type RawSignup = {
  id: string
  email: string | null
  created_at: string
  email_confirmed_at?: string | null
  user_metadata?: Record<string, unknown> | null
  birth_year?: number | null
  comp_pro_until?: string | null
  comp_reason?: string | null
  bonus_pro_until?: string | null
  signup_ref?: string | null
  signup_attribution?: Record<string, unknown> | null
  seat_slug?: string | null
  sub_plan?: string | null
  sub_status?: string | null
  sub_period_end?: string | null
}

export type SignupRow = {
  id: string
  createdAt: string
  createdPt: string
  type: AccountType
  source: string
  flag: Flag
  flagReason: string | null
  plan: string
}

export function youngestAge(birthYear: number, now = new Date()): number {
  return now.getUTCFullYear() - birthYear - 1
}
export function isKid(r: RawSignup, now = new Date()): boolean {
  const by = r.birth_year ?? Number(r.user_metadata?.birth_year ?? NaN)
  if (Number.isInteger(by) && by > 1900) return youngestAge(by as number, now) < 13
  return !!r.user_metadata?.parent_email
}

/** The email the owner may reveal: the parent's for under-13s, otherwise the account's own. */
export function revealEmail(r: RawSignup, now = new Date()): string | null {
  if (isKid(r, now)) {
    const p = r.user_metadata?.parent_email
    return typeof p === 'string' && p ? p : null
  }
  return r.email ?? null
}

const QA_RE = /(^|[^a-z0-9])(qa|qc)([_\-.0-9]|$)/i
export function classify(r: RawSignup, owners = ownerAccountEmails()): { flag: Flag; reason: string | null } {
  const email = String(r.email ?? '').toLowerCase()
  const local = email.split('@')[0] ?? ''
  if (email && owners.includes(email)) return { flag: 'owner', reason: 'owner account' }
  if (local.startsWith('support+')) return { flag: 'test', reason: 'support+ address' }
  if (QA_RE.test(local)) return { flag: 'test', reason: 'qa_/qc name' }
  const a = r.signup_attribution ?? {}
  const tags = [r.comp_reason, r.seat_slug, r.signup_ref, a.utm_campaign, a.utm_source, a.ref]
    .map(v => String(v ?? '').toLowerCase())
  if (tags.some(t => /(^|[^a-z0-9])(qa|qc)[_\-0-9]/.test(t) || t.includes('qa_center'))) return { flag: 'test', reason: 'qa center/campaign tag' }
  // A kid whose parent is the owner or a support+ address is ours too.
  const parent = String(r.user_metadata?.parent_email ?? '').toLowerCase()
  if (parent && owners.includes(parent)) return { flag: 'owner', reason: "owner's kid test" }
  if (parent.startsWith('support+')) return { flag: 'test', reason: 'support+ parent' }
  return { flag: 'real', reason: null }
}

export function sourceLabel(r: RawSignup): string {
  if (r.seat_slug) return `Center link: ${r.seat_slug}`
  const pilot = /^pilot:(.+)$/.exec(r.comp_reason ?? '')
  if (pilot) return `Center link: ${pilot[1]}`
  const a = (r.signup_attribution ?? {}) as Record<string, unknown>
  const src = (a.ref as string) || (a.utm_source as string) || r.signup_ref || null
  const camp = (a.utm_campaign as string) || null
  const med = (a.utm_medium as string) || null
  if (src || camp) return [src ?? 'unknown', med && `(${med})`, camp && `· ${camp}`].filter(Boolean).join(' ')
  const refr = a.referrer as string | undefined
  if (refr) return `Referrer: ${refr}`
  return 'Direct'
}

export function fmtPt(iso: string, withTime = true): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  }).format(new Date(iso)) + (withTime ? ' PT' : '')
}

export function planLabel(r: RawSignup, now = Date.now()): string {
  const live = r.sub_status === 'active' || r.sub_status === 'trialing'
  if (r.sub_plan === 'pro' && live) return r.sub_status === 'trialing' ? 'Paid Pro (card trial)' : 'Paid Pro'
  if (r.comp_pro_until && new Date(r.comp_pro_until).getTime() > now)
    return `Free Pro until ${fmtPt(r.comp_pro_until, false)}${/^pilot:/.test(r.comp_reason ?? '') ? ' (center pilot)' : ''}`
  if (r.bonus_pro_until && new Date(r.bonus_pro_until).getTime() > now)
    return `Free Pro week until ${fmtPt(r.bonus_pro_until, false)}`
  return 'Free'
}

export function buildRows(raw: RawSignup[], now = new Date()): SignupRow[] {
  const parentEmails = new Set(raw.filter(r => isKid(r, now))
    .map(r => String(r.user_metadata?.parent_email ?? '').toLowerCase()).filter(Boolean))
  return raw
    .map(r => {
      const { flag, reason } = classify(r)
      const type: AccountType = r.seat_slug ? 'center seat' : isKid(r, now) ? 'kid'
        : parentEmails.has(String(r.email ?? '').toLowerCase()) ? 'parent' : 'adult'
      return { id: r.id, createdAt: r.created_at, createdPt: fmtPt(r.created_at), type, source: sourceLabel(r), flag, flagReason: reason, plan: planLabel(r, now.getTime()) }
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** Start of the current PT day/week (Monday)/month, as UTC instants. */
export function ptPeriodStarts(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(now).map(p => [p.type, p.value]))
  const y = +parts.year, m = +parts.month, d = +parts.day
  // PT offset right now (minutes): local wall time minus UTC.
  const wall = Date.UTC(y, m - 1, d, +parts.hour, +parts.minute, +parts.second)
  const off = wall - Math.floor(now.getTime() / 1000) * 1000
  const midnight = (yy: number, mm: number, dd: number) => new Date(Date.UTC(yy, mm - 1, dd) - off)
  const dow = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(parts.weekday)
  return { week: midnight(y, m, d - dow), month: midnight(y, m, 1) }
}

export function summarize(rows: SignupRow[], includeTests: boolean, now = new Date()) {
  const pool = includeTests ? rows : rows.filter(r => r.flag === 'real')
  const { week, month } = ptPeriodStarts(now)
  const since = (t: Date) => pool.filter(r => new Date(r.createdAt) >= t).length
  return { week: since(week), month: since(month), all: pool.length, hidden: rows.length - pool.length }
}

export const ADMIN_HOME = '/admin/signups'

/** Return path for the sign-in page: only same-site /admin paths (plus ?all=1), never a full URL. */
export function safeAdminNext(pathname: string, search = ''): string {
  if (!/^\/admin(\/[a-z0-9_-]+)*\/?$/i.test(pathname) || pathname.includes('//')) return ADMIN_HOME
  const path = pathname === '/admin' || pathname === '/admin/' ? ADMIN_HOME : pathname.replace(/\/$/, '')
  return new URLSearchParams(search).get('all') === '1' ? `${path}?all=1` : path
}

export type AdminGate = { action: 'allow' } | { action: 'login'; next: string } | { action: 'not_found' }

/**
 * Admin access decision (used by middleware, page and API). Signed out: pages go to sign-in,
 * API calls get a bare 404 (no data). Signed in but not an allowlisted owner: 404.
 */
export function adminGate(pathname: string, search: string,
  user: { email?: string | null; email_confirmed_at?: string | null } | null | undefined): AdminGate {
  if (isAdminUser(user)) return { action: 'allow' }
  if (!user && !pathname.startsWith('/api/')) return { action: 'login', next: safeAdminNext(pathname, search) }
  return { action: 'not_found' }
}

export function loginUrlFor(next: string): string {
  return `/auth/login?next=${encodeURIComponent(next)}`
}
