// Wires the signup alert to the service-role DB and the site's existing email sender (Resend).
import { createHmac } from 'crypto'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'
import { SUPPORT_EMAIL } from '@/lib/site-config'
import { loadFullSignup } from './server'
import { maybeSendSignupAlert } from './signup-alert'

const FROM = 'Algegram <noreply@algegram.xyz>'

function keyHash(key: string) {
  const secret = process.env.GUEST_COOKIE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'signup-alert'
  return createHmac('sha256', secret).update(`signup-alert:${key}`).digest('hex')
}

/** Call once an account is activated. Never throws, never blocks signup on failure. */
export async function notifyNewSignup(userId: string): Promise<void> {
  try {
    if (process.env.SIGNUP_ALERTS_DISABLED === 'true' || !process.env.RESEND_API_KEY) return
    const db = createServiceClient()
    const raw = await loadFullSignup(db, userId)
    if (!raw) return
    await maybeSendSignupAlert(raw, {
      claim: async key => {
        const { error } = await db.from('signup_alerts').insert({ key_hash: keyHash(key) })
        if (!error) return 'claimed'
        return error.code === '23505' ? 'used' : 'error'
      },
      send: async msg => {
        const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: FROM, to: SUPPORT_EMAIL, subject: msg.subject, text: msg.text } as any)
        if (error) throw new Error('send')
      },
    })
  } catch {
    console.error('[signup-alert] failed')
  }
}

/** Same, but gives up waiting after `ms` so a slow mail provider can't hold a response. */
export async function notifyNewSignupBounded(userId: string, ms = 4000): Promise<void> {
  await Promise.race([notifyNewSignup(userId), new Promise<void>(r => setTimeout(r, ms))])
}
