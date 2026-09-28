import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/emails/welcome'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/chat'

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('[auth/callback] Code exchange failed:', exchangeError.message)
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Send welcome email on first confirmation (onboarded flag not yet set)
  if (user && !user.user_metadata?.onboarded) {
    // Fire-and-forget: don't block the redirect on email delivery
    ;(async () => {
      try {
        if (user.email) await sendWelcomeEmail(user.email)
      } catch (e) {
        console.error('[auth/callback] Welcome email failed:', e)
      }

      // Mark the user as onboarded via the service-role client (bypasses RLS)
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
