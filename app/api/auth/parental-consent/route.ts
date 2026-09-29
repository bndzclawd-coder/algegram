import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { childEmail, childBirthYear, parentEmail } = body

  if (!childEmail || !childBirthYear || !parentEmail) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  const secret = process.env.CONSENT_JWT_SECRET
  if (!secret) return NextResponse.json({ error: 'Server config error.' }, { status: 500 })

  const token = jwt.sign(
    { childEmail, parentEmail, childBirthYear, type: 'parental-consent' },
    secret,
    { expiresIn: '1h' }
  )

  const consentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/consent?token=${token}`
  const deleteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/consent?token=${token}&action=delete`

  try {
    await resend.emails.send({
      from: 'Algegram <noreply@algegram.xyz>',
      to: parentEmail,
      subject: `Permission needed for ${childEmail} to use Algegram`,
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 2rem;">
          <h2 style="color: #6c63ff;">Parental Consent Request — Algegram</h2>
          <p>Hello,</p>
          <p>
            <strong>${childEmail}</strong> (birth year: ${childBirthYear}) would like to create an Algegram account to get help with math.
            Algegram is an AI-powered math tutor.
          </p>
          <p>As a parent or guardian, your permission is required for users under 13 (COPPA compliance).</p>
          <p>
            <strong>What data we collect for under-13 accounts:</strong><br/>
            Email address only. Math question history is <em>not</em> saved until you grant consent and the child opts in.
          </p>
          <div style="margin: 2rem 0; display: flex; flex-direction: column; gap: 1rem;">
            <a href="${consentUrl}" style="display: inline-block; background: #6c63ff; color: #fff; padding: 0.9rem 2rem; border-radius: 10px; text-decoration: none; font-weight: 700;">
              ✅ Approve and create account
            </a>
            <br/>
            <a href="${deleteUrl}" style="display: inline-block; color: #aaa; font-size: 0.85rem;">
              ❌ Decline — delete this request
            </a>
          </div>
          <p style="color: #888; font-size: 0.8rem;">
            This link expires in 1 hour. If you did not request this, you can safely ignore this email.
            Questions? Email <a href="mailto:privacy@algegram.xyz">privacy@algegram.xyz</a>
          </p>
        </div>
      `,
    })
  } catch (err: any) {
    console.error('Resend error:', err)
    return NextResponse.json({ error: 'Failed to send email. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
