import { stripe } from '@/lib/stripe'
import { refundCurrentPeriod } from './billing'

type Db = { from: (t: string) => any; auth: { admin: { deleteUser: (id: string) => Promise<{ error: any }> } } }

// Tables with user data. All also reference auth.users ON DELETE CASCADE; deleting explicitly
// first means a missing cascade can never leave data behind. 42P01 = table not created yet.
export const USER_TABLES = ['conversations', 'usage', 'premium_usage', 'user_attribution', 'user_profiles', 'subscriptions'] as const

export type DeleteResult = { ok: boolean; stage?: 'lookup' | 'stripe' | 'refund' | 'data' | 'auth' }

/**
 * Shared account deletion (used by /api/account/delete and the 14-day under-13 cron).
 * Order: cancel Stripe (optionally refund current period) -> delete tables -> delete auth user.
 * Stops on any Stripe failure so we never delete an account Stripe keeps billing.
 */
export async function deleteAccountData(db: Db, userId: string, opts: { refundCurrentPeriod?: boolean } = {}): Promise<DeleteResult> {
  const { data: sub, error: subErr } = await db.from('subscriptions')
    .select('stripe_subscription_id, status').eq('user_id', userId).maybeSingle()
  if (subErr && subErr.code !== '42P01') {
    console.error('[delete] subscription lookup failed', { code: subErr.code })
    return { ok: false, stage: 'lookup' }
  }
  if (sub?.stripe_subscription_id) {
    if (opts.refundCurrentPeriod) {
      // Refund before cancel: the invoice/period info is still current.
      if (await refundCurrentPeriod(sub.stripe_subscription_id) === 'error') return { ok: false, stage: 'refund' }
    }
    try {
      await stripe.subscriptions.cancel(sub.stripe_subscription_id)
    } catch (err: any) {
      const alreadyGone = err?.code === 'resource_missing' ||
        (err?.type === 'StripeInvalidRequestError' && /canceled/i.test(String(err?.message)))
      if (!alreadyGone) {
        console.error('[delete] stripe cancel failed', { type: err?.type, code: err?.code })
        return { ok: false, stage: 'stripe' }
      }
    }
  }

  for (const table of USER_TABLES) {
    const { error } = await db.from(table).delete().eq('user_id', userId)
    if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
      console.error('[delete] table delete failed', { table, code: error.code })
      return { ok: false, stage: 'data' }
    }
  }

  const { error: delErr } = await db.auth.admin.deleteUser(userId)
  if (delErr) {
    console.error('[delete] auth delete failed', { status: delErr.status })
    return { ok: false, stage: 'auth' }
  }
  return { ok: true }
}
