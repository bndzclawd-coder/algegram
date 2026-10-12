import { resolvePro } from '@/lib/account/pro'
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { guestSecret } from '@/lib/guest-limit'
import { FREE_LESSONS_PER_DAY, readGuestLessons, setGuestLessons } from './limit'

export type LessonAccess = { allowed: boolean; pro: boolean; locked: boolean; reason?: string; ageRequired?: boolean }

const UNAVAILABLE = NextResponse.json({ error: 'Lessons are temporarily unavailable.' }, { status: 503 })

/** consume=false: read-only status. consume=true: count one lesson (atomic for accounts). */
export async function lessonAccess(req: NextRequest, consume: boolean): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const secret = guestSecret()
    if (!secret) return UNAVAILABLE
    const used = readGuestLessons(req, secret)
    if (used >= FREE_LESSONS_PER_DAY) return json({ allowed: false, pro: false, locked: true }, consume ? 429 : 200)
    const res = json({ allowed: true, pro: false, locked: false })
    if (consume) setGuestLessons(res, secret, used + 1)
    return res
  }

  const db = createServiceClient()
  // Same server-verified age gate as /api/chat.
  const { data: profile, error: profErr } = await db.from('user_profiles').select('age_verified').eq('user_id', user.id).maybeSingle()
  if (profErr) { console.error('[lesson] profile lookup failed', { code: profErr.code }); return UNAVAILABLE }
  if (!profile?.age_verified) return json({ allowed: false, pro: false, locked: false, ageRequired: true, reason: 'age' }, 403)

  const { isPro } = await resolvePro(db, user.id)
  if (isPro) return json({ allowed: true, pro: true, locked: false })

  const day = new Date().toISOString().slice(0, 10)
  if (!consume) {
    const { data, error } = await db.from('lesson_usage').select('count').eq('user_id', user.id).eq('day', day).maybeSingle()
    if (error) { console.error('[lesson] usage read failed', { code: error.code }); return UNAVAILABLE }
    const locked = (data?.count ?? 0) >= FREE_LESSONS_PER_DAY
    return json({ allowed: !locked, pro: false, locked })
  }
  const { data, error } = await db.rpc('increment_lesson_usage', { p_user_id: user.id, p_day: day, p_limit: FREE_LESSONS_PER_DAY })
  if (error) { console.error('[lesson] increment_lesson_usage failed', { code: error.code }); return UNAVAILABLE }
  if (data === null) return json({ allowed: false, pro: false, locked: true }, 429)
  return json({ allowed: true, pro: false, locked: false })
}

function json(body: LessonAccess, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}
