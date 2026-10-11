import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { deleteAccountData } from '@/lib/account/delete'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await deleteAccountData(createServiceClient(), user.id)
  if (!result.ok) {
    if (result.stage === 'stripe') return NextResponse.json({ error: 'We could not cancel your subscription, so your account was not deleted. Please try again later.' }, { status: 502 })
    if (result.stage === 'auth') return NextResponse.json({ error: 'Failed to delete account.' }, { status: 500 })
    return NextResponse.json({ error: 'Could not delete your account right now. Please try again.' }, { status: result.stage === 'lookup' ? 503 : 500 })
  }

  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
}
