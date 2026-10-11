import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Tables with user data. All also reference auth.users ON DELETE CASCADE; deleting explicitly
// first means a missing cascade can never leave data behind. 42P01 = table not created yet.
const USER_TABLES = ['conversations', 'questions', 'usage', 'premium_usage', 'user_attribution', 'user_profiles', 'subscriptions'] as const

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()

  // 1. Cancel the Stripe subscription. If this fails, STOP: deleting the account while Stripe
  //    keeps billing would charge someone with no account to cancel from.
  const { data: sub, error: subErr } = await db.from('subscriptions')
    .select('stripe_subscription_id, status').eq('user_id', user.id).maybeSingle()
  if (subErr && subErr.code !== '42P01') {
    console.error('[delete] subscription lookup failed', { code: subErr.code })
    return NextResponse.json({ error: 'Could not delete your account right now. Please try again.' }, { status: 503 })
  }
  if (sub?.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(sub.stripe_subscription_id)
    } catch (err: any) {
      const alreadyGone = err?.code === 'resource_missing' ||
        (err?.type === 'StripeInvalidRequestError' && /canceled/i.test(String(err?.message)))
      if (!alreadyGone) {
        console.error('[delete] stripe cancel failed', { type: err?.type, code: err?.code })
        return NextResponse.json({ error: 'We could not cancel your subscription, so your account was not deleted. Please try again later.' }, { status: 502 })
      }
    }
  }

  // 2. Delete user data explicitly.
  for (const table of USER_TABLES) {
    const { error } = await db.from(table).delete().eq('user_id', user.id)
    if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
      console.error('[delete] table delete failed', { table, code: error.code })
      return NextResponse.json({ error: 'Could not delete your account right now. Please try again.' }, { status: 500 })
    }
  }

  // 3. Delete the auth user (cascades anything left).
  const { error: delErr } = await db.auth.admin.deleteUser(user.id)
  if (delErr) {
    console.error('[delete] auth delete failed', { status: delErr.status })
    return NextResponse.json({ error: 'Failed to delete account.' }, { status: 500 })
  }

  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
}
