'use client'
import { hasLessonContent, isPracticeProblem } from '@/lib/whiteboard/parse'
import { OFF_TOPIC_REPLY } from '@/lib/chat/off-topic'

// Label shown on the chip -> the message it sends (a normal chat message: same limits as typing it).
export const QUICK_REPLIES = [
  { label: 'Try one like this', text: 'Give me one like this to try' },
  { label: 'Easier', text: 'Give me an easier one' },
  { label: 'Harder', text: 'Give me a harder one' },
  { label: 'Explain simpler', text: 'Explain it simpler' },
] as const

/** Chips go only under a finished math answer: not under refusals, errors, clarifying questions or practice problems. */
export function showQuickReplies(content: string): boolean {
  const c = (content || '').trim()
  if (!c || c.startsWith('⚠️') || c.includes(OFF_TOPIC_REPLY)) return false
  return hasLessonContent(c) && !isPracticeProblem(c)
}

export default function QuickReplyChips({ onPick, disabled }: { onPick: (text: string) => void; disabled?: boolean }) {
  const chip = { fontSize: '0.78rem', fontWeight: 600, borderRadius: 999, padding: '0.3rem 0.75rem', minHeight: 32, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-dim)', cursor: 'pointer', whiteSpace: 'nowrap' } as const
  return (
    <div role='group' aria-label='Quick replies' data-testid='quick-replies' style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '6px 0 0.75rem 2.25rem' }}>
      {QUICK_REPLIES.map(q => (
        <button key={q.label} type='button' style={chip} disabled={disabled} onClick={() => onPick(q.text)}>{q.label}</button>
      ))}
    </div>
  )
}
