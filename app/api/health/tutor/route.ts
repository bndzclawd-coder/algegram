// Hourly tutor health check (called by .github/workflows/tutor-health.yml). Protected by HEALTHCHECK_SECRET
// (its own secret, separate from the cron secret). Stores only counts/status codes in public.tutor_health; no text.
// ?force=fail (secret required) swaps turn 1 to a bogus model id to test alerting end to end.
// ?reset=1 (secret required) clears the failure state without calling any model.
import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'
import { SUPPORT_EMAIL } from '@/lib/site-config'
import { runTutorCheck, PRO_STANDARD_COVERED, type StepResult } from '@/lib/health/tutor'
import { nextHealthState, ptTime, type HealthState } from '@/lib/health/tutor-state'

export const dynamic = 'force-dynamic'
export const maxDuration = 60
const FROM = 'Algegram <noreply@algegram.xyz>'

function authorized(req: NextRequest): boolean {
  const secret = process.env.HEALTHCHECK_SECRET
  const got = req.headers.get('authorization')?.replace(/^Bearer /, '') ?? ''
  if (!secret || secret.length < 16) return false
  const a = Buffer.from(got), b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b)
}

async function email(subject: string, text: string) {
  if (!process.env.RESEND_API_KEY) throw new Error('no resend key')
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: FROM, to: SUPPORT_EMAIL, subject, text } as any)
  if (error) throw new Error('send')
}

function describe(steps: StepResult[]) {
  return steps.map(s => `- ${s.step === 'first' ? 'First question' : 'Follow-up "Try one like this"'}: model ${s.model}, ${s.ok ? 'OK' : 'FAILED'}, HTTP ${s.status || 'timeout/network'}`).join('\n')
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const db = createServiceClient()
  if (url.searchParams.get('reset') === '1') {
    const { error } = await db.from('tutor_health').upsert({ id: 1, consecutive_failures: 0, alerted: false, last_ok: null, last_status: null, last_model: null, checked_at: null })
    return NextResponse.json({ reset: !error })
  }
  const forced = url.searchParams.get('force') === 'fail'
  const steps = await runTutorCheck(forced)
  const ok = steps.every(s => s.ok)
  const failed = steps.find(s => !s.ok)

  const { data } = await db.from('tutor_health').select('consecutive_failures, alerted').eq('id', 1).maybeSingle()
  const prev: HealthState = { consecutive_failures: data?.consecutive_failures ?? 0, alerted: data?.alerted ?? false }
  const { state, action } = nextHealthState(prev, ok)
  const now = new Date()
  let emailed: string | null = null
  try {
    if (action === 'alert') {
      await email(`Algegram tutor DOWN: ${failed?.model} HTTP ${failed?.status || 'timeout'}`,
        `The hourly tutor health check failed ${state.consecutive_failures} times in a row.\n\nLatest run at ${ptTime(now)}:\n${describe(steps)}\n${forced ? '\n(This was a forced-failure test.)\n' : ''}\nYou'll get one recovery email when it passes again.`)
      emailed = 'alert'
    } else if (action === 'recovery') {
      await email('Algegram tutor recovered', `The hourly tutor health check passed again at ${ptTime(now)}.\n\n${describe(steps)}`)
      emailed = 'recovery'
    }
  } catch {
    console.error('[health] email failed', { action })
  }
  // If the alert email failed, keep alerted=false so the next failing run retries it.
  const saved = action === 'alert' && !emailed ? { ...state, alerted: false } : state
  await db.from('tutor_health').upsert({ id: 1, ...saved, last_ok: ok, last_status: failed?.status ?? steps[steps.length - 1].status, last_model: failed?.model ?? null, checked_at: now.toISOString() })
  if (!ok) console.error('[health] tutor check failed', { model: failed?.model, status: failed?.status, forced })
  return NextResponse.json({ ok, forced, steps, consecutive_failures: saved.consecutive_failures, alerted: saved.alerted, emailed, pro_standard_same_as_follow_up: PRO_STANDARD_COVERED }, { status: ok ? 200 : 503 })
}
