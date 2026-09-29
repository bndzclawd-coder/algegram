import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()

  // 1. Cancel active Stripe subscription
  try {
    const { data: sub } = await db.from('subscriptions').select('stripe_subscription_id').eq('user_id', user.id).single()
    if (sub?.stripe_subscription_id) {
      await stripe.subscriptions.cancel(sub.stripe_subscription_id)
    }
  } catch {}

  // 2. Delete question history (if questions table exists)
  try {
    await db.from('questions').delete().eq('user_id', user.id)
  } catch {}

  // 3. Delete usage records
  try {
    await db.from('usage').delete().eq('user_id', user.id)
  } catch {}

  // 4. Delete subscription record
  try {
    await db.from('subscriptions').delete().eq('user_id', user.id)
  } catch {}

  // 5. Delete user via Supabase admin
  const { error: delErr } = await db.auth.admin.deleteUser(user.id)
  if (delErr) {
    console.error('Failed to delete user:', delErr)
    return NextResponse.json({ error: 'Failed to delete account.' }, { status: 500 })
  }

  // 6. Sign out
  await supabase.auth.signOut()

  return NextResponse.json({ ok: true })
}
