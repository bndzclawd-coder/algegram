import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/emails/welcome'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    await sendWelcomeEmail(email)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[onboarding] Failed to send welcome email:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
