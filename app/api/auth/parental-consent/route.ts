import { NextRequest, NextResponse } from 'next/server'
import { readCenterCookie, centerSeatStatus } from '@/lib/center/link'
import { centerDisplayName } from '@/lib/center/display'
import { createServiceClient } from '@/lib/supabase/server'
import jwt from 'jsonwebtoken'
import { attributionForToken } from '@/lib/attribution/server'
import { ipHash, readRefCookie } from '@/lib/referral'
import { EMAIL_RE, isUnder13, parseBirthYear } from '@/lib/age'
import { checkConsentLimits, sendConsentEmail, withTimeout, KID_SEND_ERROR, LIMITS_TIMEOUT_MS } from '@/lib/account/consent-email'

export const dynamic = 'force-dynamic'
export const maxDuration = 30 // hard stop; internal timeouts below fire well before this

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const childEmail = String(body?.childEmail ?? '').trim().toLowerCase()
  const parentEmail = String(body?.parentEmail ?? '').trim().toLowerCase()
  const childBirthYear = parseBirthYear(body?.childBirthYear)

  if (!EMAIL_RE.test(childEmail) || !EMAIL_RE.test(parentEmail) || !childBirthYear) {
    return NextResponse.json({ error: 'Please check the email addresses and birth year.' }, { status: 400 })
  }
  if (childEmail === parentEmail) {
    return NextResponse.json({ error: 'The parent email must be different from the child email.' }, { status: 400 })
  }
  if (!isUnder13(childBirthYear)) {
    return NextResponse.json({ error: 'Parental consent is only needed for users under 13.' }, { status: 400 })
  }

  const secret = process.env.CONSENT_JWT_SECRET
  if (!secret) return NextResponse.json({ error: 'Server config error.' }, { status: 500 })

  let limited
  try {
    limited = await withTimeout(checkConsentLimits(req, parentEmail), LIMITS_TIMEOUT_MS, 'rate-limit')
  } catch (e) {
    console.error('[consent] limit check failed', { name: (e as Error)?.name })
    return NextResponse.json({ error: KID_SEND_ERROR }, { status: 503 })
  }
  if (limited) return NextResponse.json({ error: limited.error }, { status: limited.status })

  const token = jwt.sign({ childEmail, parentEmail, childBirthYear, type: 'parental-consent', attr: attributionForToken(), ref: readRefCookie(), iph: ipHash(req), ctr: readCenterCookie() }, secret, { expiresIn: '1h' })
  // Center-link signup (open seats): the email says the center's Pro starts at approval, no free-week text.
  const ctr = readCenterCookie()
  let centerName: string | null = null
  if (ctr && (await centerSeatStatus(createServiceClient() as any, ctr)) === 'open') {
    const { data } = await (createServiceClient() as any).from('center_pilots').select('display_name').eq('center_slug', ctr).maybeSingle()
    centerName = centerDisplayName(ctr, data?.display_name)
  }
  const sent = await sendConsentEmail({ parentEmail, childEmail, childBirthYear, token, centerName })
  if (!sent) return NextResponse.json({ error: KID_SEND_ERROR }, { status: 502 })

  return NextResponse.json({ ok: true })
}
