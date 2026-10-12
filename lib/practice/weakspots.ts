// Weak spots + weekly summary from practice_results (topic, score, total, created_at only).
import { isTopic, topicLabel, type TopicId } from './topics'

export type ResultRow = { topic: string; score: number; total: number; created_at: string }
export type TopicStat = { topic: TopicId; label: string; score: number; total: number; pct: number; prevPct: number | null }

const DAY = 24 * 60 * 60 * 1000
/** Minimum questions answered in a topic before we call it a weak spot. */
export const WEAK_MIN_QUESTIONS = 3
export const WEAK_THRESHOLD = 0.8

function agg(rows: ResultRow[]) {
  const m = new Map<TopicId, { score: number; total: number }>()
  for (const r of rows) {
    if (!isTopic(r.topic) || !(r.total > 0)) continue
    const a = m.get(r.topic) ?? { score: 0, total: 0 }
    a.score += r.score; a.total += r.total
    m.set(r.topic, a)
  }
  return m
}

/** Lowest-accuracy topics (worst first), only topics with enough answers and below the threshold. */
export function weakSpots(rows: ResultRow[], limit = 3): TopicStat[] {
  return Array.from(agg(rows).entries())
    .filter(([, a]) => a.total >= WEAK_MIN_QUESTIONS && a.score / a.total < WEAK_THRESHOLD)
    .map(([topic, a]) => ({ topic, label: topicLabel(topic), score: a.score, total: a.total, pct: Math.round((a.score / a.total) * 100), prevPct: null }))
    .sort((x, y) => x.pct - y.pct || y.total - x.total)
    .slice(0, limit)
}

/** This week (last 7 days) per topic, with the previous 7 days for trend. */
export function weeklySummary(rows: ResultRow[], now = Date.now()) {
  const cur = rows.filter(r => now - new Date(r.created_at).getTime() < 7 * DAY)
  const prev = rows.filter(r => { const t = now - new Date(r.created_at).getTime(); return t >= 7 * DAY && t < 14 * DAY })
  const c = agg(cur), p = agg(prev)
  const topics: TopicStat[] = Array.from(c.entries()).map(([topic, a]) => {
    const b = p.get(topic)
    return { topic, label: topicLabel(topic), score: a.score, total: a.total, pct: Math.round((a.score / a.total) * 100), prevPct: b ? Math.round((b.score / b.total) * 100) : null }
  }).sort((x, y) => y.total - x.total)
  const sum = (m: Map<TopicId, { score: number; total: number }>) => Array.from(m.values()).reduce((s, a) => ({ score: s.score + a.score, total: s.total + a.total }), { score: 0, total: 0 })
  const tc = sum(c), tp = sum(p)
  return {
    sets: cur.length,
    questions: tc.total,
    pct: tc.total ? Math.round((tc.score / tc.total) * 100) : null,
    prevPct: tp.total ? Math.round((tp.score / tp.total) * 100) : null,
    topics,
    weakest: weakSpots(cur.concat(prev), 1)[0] ?? null,
  }
}
export type WeeklySummary = ReturnType<typeof weeklySummary>
