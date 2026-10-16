import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import type { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { guestSecret } from '@/lib/guest-limit'

// Signed center-link cookie: set by /p/<center> only for centers with a center_pilots record.
// Server-validated (HMAC); the client can't forge a center. Holds the center slug only.
export const CENTER_COOKIE = 'ag_ctr'
const SLUG = /^[a-z0-9_]{1,40}$/
const mac = (s: string, v: string) => createHmac('sha256', s).update(`center:${v}`).digest('hex')

export function setCenterCookie(res: NextResponse, slug: string) {
  const s = guestSecret(); if (!s || !SLUG.test(slug)) return
  res.cookies.set(CENTER_COOKIE, `${slug}.${mac(s, slug)}`, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30, secure: process.env.NODE_ENV === 'production' })
}

export function readCenterCookie(): string | null {
  const s = guestSecret(); const raw = cookies().get(CENTER_COOKIE)?.value
  if (!s || !raw) return null
  const i = raw.lastIndexOf('.'); if (i < 0) return null
  const slug = raw.slice(0, i), got = Buffer.from(raw.slice(i + 1)), want = Buffer.from(mac(s, slug))
  if (!SLUG.test(slug) || got.length !== want.length || !timingSafeEqual(got, want)) return null
  return slug
}

export function cleanCenterSlug(v: unknown): string | null {
  return typeof v === 'string' && SLUG.test(v) ? v : null
}

type Db = { rpc: (fn: string, args: object) => any }
export async function centerSeatStatus(db: Db, slug: string): Promise<'open' | 'full' | 'none'> {
  const { data, error } = await db.rpc('center_seat_status', { p_slug: slug })
  if (error) { console.error('[center] status failed', { code: error.code }); return 'none' }
  return data === 'open' || data === 'full' ? data : 'none'
}

/** Enrolls an activated account into its center (atomic, capped). Sends the one-time internal "center is full" alert. */
export async function enrollCenter(db: Db, userId: string, slug: string): Promise<'enrolled' | 'full' | 'none'> {
  const { data, error } = await db.rpc('enroll_center_seat', { p_user: userId, p_slug: slug })
  if (error) { console.error('[center] enroll failed', { code: error.code }); return 'none' }
  const status = data?.status as 'enrolled' | 'full' | 'none'
  if (status === 'full') await db.rpc('mark_center_overflow', { p_user: userId, p_slug: slug })
  if (data?.filled || status === 'full') {
    const { data: claimed } = await db.rpc('claim_center_full_alert', { p_slug: slug })
    if (claimed === true) await sendCenterFullAlert(slug)
  }
  return status ?? 'none'
}

async function sendCenterFullAlert(slug: string) {
  try {
    if (!process.env.RESEND_API_KEY) return
    // Internal only. Center slug only, nothing about any student.
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: 'Algegram <noreply@algegram.xyz>', to: 'support@algegram.xyz',
      subject: `Center pilot full: ${slug}`,
      text: `The center pilot "${slug}" has filled all of its seats. New students who use its link will get regular accounts.\n\nThis is an automatic internal alert, sent once per center.`,
    } as any)
    if (error) console.error('[center] full alert failed', { name: error.name })
    else console.log('[center] full alert sent', { slug })
  } catch (e) { console.error('[center] full alert threw', { name: (e as Error)?.name }) }
}
