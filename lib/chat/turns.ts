/** Helpers so a failed reply never costs a free question and never hides the follow-up chips. */
export type Turn = { role: 'user' | 'assistant'; content: string }

/** Error notices the chat shows as assistant bubbles (never real tutor answers). */
export const isErrorReply = (m: Turn) => m.role === 'assistant' && m.content.startsWith('⚠️')

/** Guest questions used after this request: only a successful, non-refusal answer counts. */
export function guestCountAfter(used: number, aiOk: boolean, refusal: boolean): number {
  return aiOk && !refusal ? used + 1 : used
}

/** Drop failed turns (an error bubble plus the user message it answered) before sending history. */
export function stripFailedTurns<T extends Turn>(messages: T[]): T[] {
  const out: T[] = []
  for (const m of messages) {
    if (isErrorReply(m)) { if (out.length && out[out.length - 1].role === 'user') out.pop(); continue }
    out.push(m)
  }
  return out
}

/** Index of the answer the chips belong under: the last real answer, as long as only failed turns follow it. */
export function chipAnswerIndex(messages: Turn[]): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (m.role === 'assistant' && !isErrorReply(m)) {
      const rest = messages.slice(i + 1)
      return stripFailedTurns(rest).length === 0 ? i : -1
    }
  }
  return -1
}
