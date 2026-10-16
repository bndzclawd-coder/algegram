import { resolvePro } from '@/lib/account/pro'
import { centerDisplayName } from '@/lib/center/display'
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/plans'
import { isChildAccount } from '@/lib/account/age-gate'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const today = new Date().toISOString().split('T')[0]

  const [{ data: usageRow }, { isPro, comp, paid, compProUntil, sub, bonus, bonusProUntil, bonusEnded, center }] = await Promise.all([
    db.from('usage').select('count').eq('user_id', user.id).eq('day', today).single(),
    resolvePro(db, user.id),
  ])
  const child = await isChildAccount(db, user)
  // Center seat label ("Pro through <center>, until <date>") and overflow notice (seats were full at signup).
  let centerName: string | null = null, centerFull = false
  {
    const [{ data: prof }, { data: seat }] = await Promise.all([
      db.from('user_profiles').select('comp_reason, center_overflow').eq('user_id', user.id).maybeSingle(),
      db.from('center_seats').select('center_slug').eq('user_id', user.id).maybeSingle(),
    ])
    const slug = seat?.center_slug ?? /^pilot:([a-z0-9_-]{1,64})$/.exec(prof?.comp_reason ?? '')?.[1] ?? null
    if (slug && center) {
      const { data: cp } = await db.from('center_pilots').select('display_name').eq('center_slug', slug.replace(/-/g, '_')).maybeSingle()
      centerName = centerDisplayName(slug.replace(/-/g, '_'), cp?.display_name)
    }
    centerFull = !center && !!prof?.center_overflow
  }
  const used = usageRow?.count ?? 0
  const limit = isPro ? null : PLANS.free.messagesPerDay

  return NextResponse.json({
    userId: user.id,
    email: user.email ?? null,
    child,
    plan: isPro ? 'pro' : 'free',
    status: paid ? sub?.status : 'active',
    comp,
    paid,
    compProUntil,
    bonus,
    bonusProUntil,
    bonusEnded,
    center,
    centerName,
    centerFull,
    used,
    limit,
    remaining: limit !== null ? Math.max(0, limit - used) : null,
    periodEnd: paid ? (sub?.current_period_end ?? null) : comp ? compProUntil : bonus ? bonusProUntil : null,
  })
}
