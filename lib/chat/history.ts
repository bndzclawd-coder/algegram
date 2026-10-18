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
