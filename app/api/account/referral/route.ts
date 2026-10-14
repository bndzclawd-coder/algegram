import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isChildAccount } from '@/lib/account/age-gate'
import { newCode, REFERRAL_CAP } from '@/lib/referral'

export const dynamic = 'force-dynamic'

// The signed-in user's referral link. Under-13 accounts get no code, link or reward info.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createServiceClient()
  if (await isChildAccount(db, user)) return NextResponse.json({ child: true })

  const { data: prof } = await db.from('user_profiles').select('referral_code').eq('user_id', user.id).maybeSingle()
  if (!prof) return NextResponse.json({ available: false })
  let code: string | null = prof.referral_code ?? null
  for (let i = 0; !code && i < 5; i++) {
    const c = newCode()
    const { error } = await db.from('user_profiles').update({ referral_code: c }).eq('user_id', user.id).is('referral_code', null)
    if (!error) {
      const { data } = await db.from('user_profiles').select('referral_code').eq('user_id', user.id).maybeSingle()
      code = data?.referral_code ?? null
    }
  }
  if (!code) return NextResponse.json({ available: false })
  const { count } = await db.from('referrals').select('referred_user_id', { count: 'exact', head: true }).eq('referrer_user_id', user.id).eq('rewarded', true)
  return NextResponse.json({
    child: false,
    available: true,
    link: `https://algegram.xyz/?utm_source=referral&utm_medium=inapp&ref=${code}`,
    rewarded: Math.min(count ?? 0, REFERRAL_CAP),
    cap: REFERRAL_CAP,
  })
}
