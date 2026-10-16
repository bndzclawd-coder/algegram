import { FREE_MODEL } from '@/lib/models'
import type { AnswerKind } from './equivalence'
import { compile } from './equivalence'
import { topicLabel, type Difficulty, type TopicId } from './topics'

export type GeneratedQuestion = { question: string; answer: string; kind: AnswerKind; steps: string[]; hint: string }
const KINDS: AnswerKind[] = ['number', 'expression', 'set', 'antiderivative']

function prompt(topic: TopicId, difficulty: Difficulty, count: number) {
  return `Write ${count} ${difficulty} practice questions on "${topicLabel(topic)}" for a student.
Return ONLY a JSON object: {"questions":[{"question":string,"answer":string,"kind":"number"|"expression"|"set"|"antiderivative","steps":string[],"hint":string}]}
Rules:
- Every question has exactly one short, checkable final answer. No proofs, no multiple choice, no word "explain".
- "answer" is plain ASCII math, no LaTeX, no units, no "x =": numbers like 7, -3/4, 2.5, 15%; expressions in x like 3x^2+2x or sqrt(x); several solutions as "2, -3" with kind "set"; integrals as an antiderivative in x without "+ C" with kind "antiderivative".
- Use kind "expression" only when the answer is a function of x.
- "question" may use LaTeX wrapped in $...$. "steps" are 2-6 short worked steps (LaTeX in $...$ allowed). "hint" is one sentence that does not give the answer.
- Geometry answers must be numbers (use decimals rounded to 2 places or exact forms like 3pi).`
}

function valid(q: any): q is GeneratedQuestion {
  return q && typeof q.question === 'string' && q.question.length > 0 && q.question.length < 600 &&
    typeof q.answer === 'string' && q.answer.length > 0 && q.answer.length < 120 &&
    KINDS.includes(q.kind) && Array.isArray(q.steps) && q.steps.length > 0 && q.steps.length <= 8 &&
    q.steps.every((s: unknown) => typeof s === 'string' && s.length < 500) &&
    typeof q.hint === 'string' && q.hint.length < 300
}

/** Parses + validates the model output. Exported for tests. Returns null unless exactly `count` usable questions. */
export function parseQuestions(text: string, count: number): GeneratedQuestion[] | null {
  let data: any
  try { data = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, '')) } catch { return null }
  const qs = Array.isArray(data?.questions) ? data.questions : null
  if (!qs) return null
  const good = qs.filter(valid).filter((q: GeneratedQuestion) => q.kind === 'set' || compile(q.answer) !== null)
  return good.length >= count ? good.slice(0, count).map((q: GeneratedQuestion) => ({
    question: q.question, answer: q.answer, kind: q.kind, steps: q.steps, hint: q.hint,
  })) : null
}

/** Calls OpenRouter with the cheap FREE_MODEL and data_collection: 'deny'. Never logs content. */
export async function generateQuestions(topic: TopicId, difficulty: Difficulty, count: number): Promise<GeneratedQuestion[] | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    let res: Response
    try {
      res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://algegram.xyz',
          'X-Title': 'Algegram',
        },
        body: JSON.stringify({
          model: FREE_MODEL,
          messages: [
            { role: 'system', content: 'You are Algegram, an AI math tutor that writes accurate practice questions. Output strict JSON only.' },
            { role: 'user', content: prompt(topic, difficulty, count + 2) },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.4,
          max_tokens: 6000,
          provider: { data_collection: 'deny', zdr: true, only: ['google-vertex'] },
        }),
      })
    } catch (e) {
      console.error('[practice] OpenRouter request threw', { name: (e as Error)?.name })
      continue
    }
    if (!res.ok) { console.error('[practice] OpenRouter request failed', { status: res.status }); continue }
    const json = await res.json().catch(() => null)
    const qs = parseQuestions(json?.choices?.[0]?.message?.content ?? '', count)
    if (qs) return qs
    console.error('[practice] model output failed validation', { attempt })
  }
  return null
}
