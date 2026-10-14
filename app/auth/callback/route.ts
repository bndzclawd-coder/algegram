import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { afterConfirm, linkIssueUrl, safeNext } from '@/lib/auth/post-confirm'

// Legacy PKCE links (emails sent before /auth/confirm). New emails use /auth/confirm.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  let next = safeNext(searchParams.get('next'))

  // token_hash links are handled server-side by /auth/confirm.
  if (tokenHash && type) {
    const u = new URL(`${origin}/auth/confirm`)
    u.searchParams.set('token_hash', tokenHash); u.searchParams.set('type', type); u.searchParams.set('next', type === 'recovery' ? '/auth/update-password' : next)
    return NextResponse.redirect(u.toString())
  }

  // Supabase sends errors (e.g. otp_expired) back as query params.
  const errCode = searchParams.get('error_code')
  if (errCode || searchParams.get('error')) {
    return NextResponse.redirect(linkIssueUrl(origin, errCode === 'otp_expired' ? 'expired' : 'confirmed', next))
  }

  if (!code) return NextResponse.redirect(`${origin}/auth/login?error=missing_code`)

  const supabase = await createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    // Usually the PKCE verifier cookie is missing (link opened on another device/browser).
    // Supabase has already confirmed the email at this point, so ask them to sign in.
    console.error('[auth/callback] code exchange failed', { status: exchangeError.status, code: (exchangeError as any).code })
    return NextResponse.redirect(linkIssueUrl(origin, 'confirmed', next))
  }

  const { data: { user } } = await supabase.auth.getUser()
  next = await afterConfirm(user, next)
  return NextResponse.redirect(`${origin}${next}`)
}
