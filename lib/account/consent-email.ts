import type { NextRequest } from 'next/server'
import { Resend } from 'resend'
import { consume, clientIp } from '@/lib/rate-limit'
import { escapeHtml } from '@/lib/age'
import { MAILBOX_LIVE } from '@/lib/site-config'

// Rate limits (hashed keys only, see lib/rate-limit.ts). Shared by new-signup and existing-account consent.
export const PER_IP = { limit: 5, windowSeconds: 60 * 60 }        // 5 requests / hour / network
export const PER_PARENT = { limit: 3, windowSeconds: 6 * 60 * 60 } // 3 emails / 6 h / parent address

export type LimitResult = null | { status: number; error: string }

export async function checkConsentLimits(req: NextRequest, parentEmail: string): Promise<LimitResult> {
  const ipCheck = await consume('consent-ip', clientIp(req), PER_IP.limit, PER_IP.windowSeconds)
  if (ipCheck === 'error') return { status: 503, error: 'Please try again later.' }
  if (ipCheck === 'limited') return { status: 429, error: 'Too many requests. Please try again later.' }
  const parentCheck = await consume('consent-parent', parentEmail, PER_PARENT.limit, PER_PARENT.windowSeconds)
  if (parentCheck === 'error') return { status: 503, error: 'Please try again later.' }
  if (parentCheck === 'limited') return { status: 429, error: 'A consent email was already sent to this address. Please check that inbox or try again later.' }
  return null
}

/** The parental consent email. Every interpolated value is HTML-escaped here. */
export async function sendConsentEmail(opts: {
  parentEmail: string; childEmail: string; childBirthYear: number; token: string; existingAccount?: boolean
}): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const consentUrl = escapeHtml(`${appUrl}/auth/consent?token=${encodeURIComponent(opts.token)}`)
  const deleteUrl = escapeHtml(`${appUrl}/auth/consent?token=${encodeURIComponent(opts.token)}&action=delete`)
  const child = escapeHtml(opts.childEmail)
  const year = escapeHtml(opts.childBirthYear)
  const contact = MAILBOX_LIVE
    ? 'Questions? Email <a href="mailto:privacy@algegram.xyz">privacy@algegram.xyz</a>'
    : `Questions? See ${escapeHtml(`${appUrl}/contact`)}`
  const intro = opts.existingAccount
    ? `<strong>${child}</strong> (birth year: ${year}) already has an Algegram account, which is paused until a parent or guardian approves it.
       If nobody approves within 14 days, the account and its data will be deleted.`
    : `<strong>${child}</strong> (birth year: ${year}) would like to create an Algegram account to get help with math.`
  const approveLabel = opts.existingAccount ? 'Approve this account' : 'Approve and create account'
  const declineLabel = opts.existingAccount ? 'Decline' : 'Decline - delete this request'

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Algegram <noreply@algegram.xyz>',
      to: opts.parentEmail,
      subject: 'Permission needed for your child to use Algegram', // no user input in the subject
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 2rem;">
          <h2 style="color: #6c63ff;">Parental Consent Request — Algegram</h2>
          <p>Hello,</p>
          <p>${intro} Algegram is an AI-powered math tutor.</p>
          <p>As a parent or guardian, your permission is required for users under 13 (COPPA compliance).</p>
          <p>
            <strong>What data we collect for under-13 accounts:</strong><br/>
            Email address only. Math question history is <em>not</em> saved until you grant consent and the child opts in.
          </p>
          <div style="margin: 2rem 0;">
            <a href="${consentUrl}" style="display: inline-block; background: #6c63ff; color: #fff; padding: 0.9rem 2rem; border-radius: 10px; text-decoration: none; font-weight: 700;">
              ${approveLabel}
            </a>
            <br/><br/>
            <a href="${deleteUrl}" style="display: inline-block; color: #aaa; font-size: 0.85rem;">
              ${declineLabel}
            </a>
          </div>
          <p style="color: #888; font-size: 0.8rem;">
            This link expires in 1 hour. If you did not request this, you can safely ignore this email.
            ${contact}
          </p>
        </div>
      `,
    })
    return true
  } catch {
    console.error('[consent] email send failed') // no addresses in logs
    return false
  }
}
