import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { Resend } from 'resend'
import { consume, clientIp } from '@/lib/rate-limit'
import { EMAIL_RE, escapeHtml, isUnder13, parseBirthYear } from '@/lib/age'
import { MAILBOX_LIVE } from '@/lib/site-config'

export const dynamic = 'force-dynamic'

// Rate limits (hashed keys only, see lib/rate-limit.ts).
const PER_IP = { limit: 5, windowSeconds: 60 * 60 }        // 5 requests / hour / network
const PER_PARENT = { limit: 3, windowSeconds: 6 * 60 * 60 } // 3 emails / 6 h / parent address

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

  const ipCheck = await consume('consent-ip', clientIp(req), PER_IP.limit, PER_IP.windowSeconds)
  if (ipCheck === 'error') return NextResponse.json({ error: 'Please try again later.' }, { status: 503 })
  if (ipCheck === 'limited') return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  const parentCheck = await consume('consent-parent', parentEmail, PER_PARENT.limit, PER_PARENT.windowSeconds)
  if (parentCheck === 'error') return NextResponse.json({ error: 'Please try again later.' }, { status: 503 })
  if (parentCheck === 'limited') return NextResponse.json({ error: 'A consent email was already sent to this address. Please check that inbox or try again later.' }, { status: 429 })

  const token = jwt.sign({ childEmail, parentEmail, childBirthYear, type: 'parental-consent' }, secret, { expiresIn: '1h' })
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const consentUrl = escapeHtml(`${appUrl}/auth/consent?token=${encodeURIComponent(token)}`)
  const deleteUrl = escapeHtml(`${appUrl}/auth/consent?token=${encodeURIComponent(token)}&action=delete`)
  const child = escapeHtml(childEmail)
  const year = escapeHtml(childBirthYear)
  const contact = MAILBOX_LIVE
    ? 'Questions? Email <a href="mailto:privacy@algegram.xyz">privacy@algegram.xyz</a>'
    : `Questions? See ${escapeHtml(`${appUrl}/contact`)}`

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Algegram <noreply@algegram.xyz>',
      to: parentEmail,
      subject: 'Permission needed for your child to use Algegram', // no user input in the subject
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 2rem;">
          <h2 style="color: #6c63ff;">Parental Consent Request — Algegram</h2>
          <p>Hello,</p>
          <p>
            <strong>${child}</strong> (birth year: ${year}) would like to create an Algegram account to get help with math.
            Algegram is an AI-powered math tutor.
          </p>
          <p>As a parent or guardian, your permission is required for users under 13 (COPPA compliance).</p>
          <p>
            <strong>What data we collect for under-13 accounts:</strong><br/>
            Email address only. Math question history is <em>not</em> saved until you grant consent and the child opts in.
          </p>
          <div style="margin: 2rem 0;">
            <a href="${consentUrl}" style="display: inline-block; background: #6c63ff; color: #fff; padding: 0.9rem 2rem; border-radius: 10px; text-decoration: none; font-weight: 700;">
              Approve and create account
            </a>
            <br/><br/>
            <a href="${deleteUrl}" style="display: inline-block; color: #aaa; font-size: 0.85rem;">
              Decline - delete this request
            </a>
          </div>
          <p style="color: #888; font-size: 0.8rem;">
            This link expires in 1 hour. If you did not request this, you can safely ignore this email.
            ${contact}
          </p>
        </div>
      `,
    })
  } catch {
    console.error('[consent] email send failed') // no addresses in logs
    return NextResponse.json({ error: 'Failed to send email. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
