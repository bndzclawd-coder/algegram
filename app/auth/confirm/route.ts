import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { afterConfirm, linkIssueUrl, safeNext } from '@/lib/auth/post-confirm'

export const dynamic = 'force-dynamic'

const TYPES: EmailOtpType[] = ['signup', 'email', 'magiclink', 'recovery', 'email_change', 'invite']

// Email links land here: the token hash is verified on the server, so no PKCE verifier cookie is
// needed and the link works on any device or browser.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  let next = safeNext(searchParams.get('next'))

  if (!tokenHash || !type || !TYPES.includes(type)) {
    return NextResponse.redirect(linkIssueUrl(origin, 'confirmed', next))
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
  if (error) {
    const code = (error as any).code
    console.error('[auth/confirm] verify failed', { status: error.status, code })
    if (type === 'recovery') return NextResponse.redirect(`${origin}/auth/login?error=reset_failed`)
    // Used or expired link. If the email was already confirmed, signing in is all that's left.
    return NextResponse.redirect(linkIssueUrl(origin, code === 'otp_expired' ? 'expired' : 'confirmed', next))
  }

  if (type === 'recovery') return NextResponse.redirect(`${origin}/auth/update-password`)

  const user = data.user ?? (await supabase.auth.getUser()).data.user
  next = await afterConfirm(user, next)
  return NextResponse.redirect(`${origin}${next}`)
}
