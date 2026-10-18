import { isPracticeProblem } from '@/lib/whiteboard/parse'

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

const GUEST_HISTORY_MESSAGES = 8
const GUEST_HISTORY_CHARS = 4000
/** Last few turns (each capped), starting on a user turn, so guests' follow-ups keep their context. */
export function guestHistory(messages: ChatMessage[]): ChatMessage[] {
  const recent = messages.slice(-GUEST_HISTORY_MESSAGES).map(m => ({ role: m.role, content: m.content.slice(0, GUEST_HISTORY_CHARS) }))
  const first = recent.findIndex(m => m.role === 'user')
  const out = first >= 0 ? recent.slice(first) : recent.slice(-1)
  return out.length ? out : messages.slice(-1)
}

/** True when the newest message is the student's reply to a chat practice problem ("Try this one: ..."). */
// "I got 4a+1 is that right", "where did I go wrong", "is 4a+1 right?": the student wants their work checked.
const CHECK_WORK = /\b(i got|my answer|is (this|that|it|mine)? ?(right|correct)|is .{1,40} (right|correct)\??$|where did i go wrong|did i (get|do) it right|check (my|this))/i

/** True when the newest message is the student's answer to a chat practice problem, or asks Layla to check their work. */
export function isAnsweringPractice(messages: ChatMessage[]): boolean {
  const n = messages.length
  if (n < 2 || messages[n - 1].role !== 'user') return false
  if (messages[n - 2].role === 'assistant' && isPracticeProblem(messages[n - 2].content)) return true
  return CHECK_WORK.test(messages[n - 1].content.trim().slice(0, 200))
}
