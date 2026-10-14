import type { User } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/server'
import { sendWelcomeEmail as sendLegacyWelcomeEmail } from '@/lib/emails/welcome'
import { lifecycleEnabled, sendWelcomeEmail } from '@/lib/email/lifecycle'
import { recordSignupAttribution } from '@/lib/attribution/server'

/** Same-site path only (no open redirect). Accepts a path, or a full URL on our own host
 *  (Supabase's {{ .RedirectTo }}), in which case its own `next` param or path is used. */
export function safeNext(raw: string | null | undefined, fallback = '/chat'): string {
  if (!raw) return fallback
  let v = raw
  if (/^https?:\/\//i.test(v)) {
    try {
      const u = new URL(v)
      if (!/(^|\.)algegram\.xyz$/i.test(u.hostname) && !/\.vercel\.app$/i.test(u.hostname) && u.hostname !== 'localhost') return fallback
      const inner = u.searchParams.get('next')
      v = inner ?? (u.pathname === '/' || u.pathname.startsWith('/auth/callback') || u.pathname.startsWith('/auth/confirm') ? fallback : u.pathname + u.search)
    } catch { return fallback }
  }
  return v.startsWith('/') && !v.startsWith('//') && !v.includes('\\') ? v : fallback
}

/** Runs after a successful email confirmation (either route). Returns the final next path. */
export async function afterConfirm(user: User | null, next: string): Promise<string> {
  // First confirmation of a "Try Pro" signup: continue to checkout even if the next param was lost.
  // /upgrade itself sends under-13 accounts to the ask-a-parent screen, never to Stripe.
  if (user && !user.user_metadata?.onboarded && user.user_metadata?.signup_plan === 'pro' && next === '/chat') next = '/upgrade'

  if (user && !user.user_metadata?.onboarded) {
    const attributionWrite = recordSignupAttribution(createServiceClient(), user.id)
    ;(async () => {
      await attributionWrite
      try {
        if (lifecycleEnabled()) await sendWelcomeEmail(user)
        else if (user.email) await sendLegacyWelcomeEmail(user.email)
      } catch (e) {
        console.error('[auth] welcome email threw', { name: (e as Error)?.name })
      }
      try {
        await createServiceClient().auth.admin.updateUserById(user.id, {
          user_metadata: { ...user.user_metadata, onboarded: true },
        })
      } catch (e) {
        console.error('[auth] could not mark user as onboarded', { name: (e as Error)?.name })
      }
    })()
  }
  return next
}

export function linkIssueUrl(origin: string, reason: 'confirmed' | 'expired', next: string) {
  return `${origin}/auth/link-issue?reason=${reason}&next=${encodeURIComponent(next)}`
}
