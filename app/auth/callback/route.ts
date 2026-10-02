import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/emails/welcome'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/chat'

  const supabase = await createClient()

  // Password reset flow: token_hash + type=recovery
  if (tokenHash && type === 'recovery') {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
    if (error) {
      console.error('[auth/callback] Recovery OTP verification failed:', error.message)
      return NextResponse.redirect(`${origin}/auth/login?error=reset_failed`)
    }
    // Session is now established — redirect to update-password page
    return NextResponse.redirect(`${origin}/auth/update-password`)
  }

  // Email confirmation / magic link flow: code (PKCE)
  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`)
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    console.error('[auth/callback] Code exchange failed:', exchangeError.message)
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
  }

  const { data: { user } } = await supabase.auth.getUser()

  // Send welcome email on first confirmation (onboarded flag not yet set)
  if (user && !user.user_metadata?.onboarded) {
    ;(async () => {
      try {
        if (user.email) await sendWelcomeEmail(user.email)
      } catch (e) {
        console.error('[auth/callback] Welcome email failed:', e)
      }
      try {
        const admin = createServiceClient()
        await admin.auth.admin.updateUserById(user.id, {
          user_metadata: { ...user.user_metadata, onboarded: true },
        })
      } catch (e) {
        console.error('[auth/callback] Could not mark user as onboarded:', e)
      }
    })()
  }

  return NextResponse.redirect(`${origin}${next}`)
}
