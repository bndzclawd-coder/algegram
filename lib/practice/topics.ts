// Fixed topic + difficulty lists for Pro practice and tests. Only these tags are ever sent to the
// model or stored (practice_results.topic is constrained to the same list in the migration).
export const PRACTICE_TOPICS = [
  { id: 'arithmetic', label: 'Arithmetic' },
  { id: 'fractions', label: 'Fractions' },
  { id: 'decimals', label: 'Decimals' },
  { id: 'percentages', label: 'Percentages' },
  { id: 'linear-equations', label: 'Linear equations' },
  { id: 'quadratics', label: 'Quadratics' },
  { id: 'geometry', label: 'Geometry' },
  { id: 'functions', label: 'Functions' },
  { id: 'derivatives', label: 'Derivatives' },
  { id: 'integrals', label: 'Integrals' },
] as const
export type TopicId = (typeof PRACTICE_TOPICS)[number]['id']

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

export const PRACTICE_COUNT = 5
export const TEST_COUNT = 10
/** Test time limit (seconds). The server allows a short grace period on top. */
export const TEST_SECONDS = 15 * 60
/** Hard cap on practice + test generations per user per UTC day. */
export const PRACTICE_DAILY_CAP = 20

export function isTopic(v: unknown): v is TopicId {
  return typeof v === 'string' && PRACTICE_TOPICS.some(t => t.id === v)
}
export function isDifficulty(v: unknown): v is Difficulty {
  return typeof v === 'string' && (DIFFICULTIES as readonly string[]).includes(v)
}
export function topicLabel(id: TopicId) {
  return PRACTICE_TOPICS.find(t => t.id === id)!.label
}
