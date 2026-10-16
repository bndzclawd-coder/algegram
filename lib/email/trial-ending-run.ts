import { createServiceClient } from '@/lib/supabase/server'
import { sendTrialEnding, type WeekStats } from '@/lib/email/trial-ending'
const H = 60 * 60 * 1000
const MAX_SENDS = 50

export async function runTrialEnding() {
  const db = createServiceClient()
  const from = new Date(Date.now() + 36 * H).toISOString(), to = new Date(Date.now() + 60 * H).toISOString()
  const [bonus, trials] = await Promise.all([
    db.from('user_profiles').select('user_id, bonus_pro_until').is('trial_ending_sent_at', null).gte('bonus_pro_until', from).lte('bonus_pro_until', to).limit(200),
    db.from('subscriptions').select('user_id, current_period_end').eq('status', 'trialing').gte('current_period_end', from).lte('current_period_end', to).limit(200),
  ])
  const due = new Map<string, { endsAt: string; paidTrial: boolean }>()
  for (const r of bonus.data ?? []) due.set(r.user_id, { endsAt: r.bonus_pro_until, paidTrial: false })
  for (const r of trials.data ?? []) due.set(r.user_id, { endsAt: r.current_period_end, paidTrial: true }) // paid trial wins

  let sent = 0, skipped = 0, failed = 0
  const since = new Date(Date.now() - 7 * 24 * H)
  for (const [userId, d] of Array.from(due.entries())) {
    if (sent >= MAX_SENDS) break
    const [{ data: prof }, { data: opt }, { data: paidSub }] = await Promise.all([
      db.from('user_profiles').select('trial_ending_sent_at').eq('user_id', userId).maybeSingle(),
      db.from('user_attribution').select('marketing_opt_out').eq('user_id', userId).maybeSingle(),
      db.from('subscriptions').select('status').eq('user_id', userId).maybeSingle(),
    ])
    if (!prof || prof.trial_ending_sent_at || opt?.marketing_opt_out) { skipped++; continue }
    const { data: u } = await db.auth.admin.getUserById(userId)
    if (!u?.user) { skipped++; continue }
    const [usage, practice] = await Promise.all([
      db.from('usage').select('day, count').eq('user_id', userId).gte('day', since.toISOString().slice(0, 10)),
      db.from('practice_results').select('total, created_at').eq('user_id', userId).gte('created_at', since.toISOString()).limit(1000),
    ])
    const days = new Set<string>()
    let questions = 0
    for (const r of usage.data ?? []) { questions += r.count ?? 0; if (r.count) days.add(r.day) }
    for (const r of practice.data ?? []) days.add(String(r.created_at).slice(0, 10))
    const stats: WeekStats = {
      questions, activeDays: days.size,
      practiceSets: practice.data?.length ?? 0,
      practiceQuestions: (practice.data ?? []).reduce((n: number, r: any) => n + (r.total ?? 0), 0),
    }
    // Mark first so overlaps/retries can't double-send.
    const { error: markErr } = await db.from('user_profiles').update({ trial_ending_sent_at: new Date().toISOString() }).eq('user_id', userId).is('trial_ending_sent_at', null)
    if (markErr) { skipped++; continue }
    const r = await sendTrialEnding(u.user, stats, d.endsAt, d.paidTrial)
    if ('sent' in r) sent++
    else if ('error' in r) { failed++; console.error('[trial-ending] send failed') }
    else skipped++
  }
  return { ok: failed === 0, sent, skipped, failed }
}
