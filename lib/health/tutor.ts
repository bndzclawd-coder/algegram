// Hourly tutor health check: the two model calls a guest makes on /ask, with the exact production
// model ids, ZDR provider routing and reasoning settings (lib/chat/ai-settings.ts), a short system prompt
// and tiny max_tokens. Stores no text; never touches guest counters, the daily guest-ask table or the network cap.
import { FREE_MODEL, PRO_DEFAULT_MODEL } from '@/lib/models'
import { FAST_MODEL, reasoningFor, providerFor, openRouterHeaders } from '@/lib/chat/ai-settings'
import { isAnsweringPractice } from '@/lib/chat/history'

export const HEALTH_QUESTION = 'What is 2+2?'
export const HEALTH_SYSTEM = 'You are a math tutor. Reply in one short line.'
export const HEALTH_MAX_TOKENS = 32
/** Exactly what the "Try one like this" chip sends (QuickReplyChips is a client module; a test keeps these equal). */
export const TRY_ONE_TEXT = 'Give me one like this to try'
export const BOGUS_MODEL = 'google/healthcheck-forced-failure'
/** Pro Standard uses the same model id as the guest follow-up model, so it is covered by step 2. */
export const PRO_STANDARD_COVERED = PRO_DEFAULT_MODEL === FREE_MODEL

type Msg = { role: 'system' | 'user' | 'assistant'; content: string }
export type StepResult = { step: 'first' | 'follow_up'; model: string; ok: boolean; status: number; ms: number
  usage?: { prompt_tokens?: number; completion_tokens?: number; reasoning_tokens?: number; cost?: number } }

async function call(model: string, messages: Msg[]): Promise<{ r: StepResult; reply: string }> {
  const started = Date.now()
  const chat = messages.filter(m => m.role !== 'system') as { role: 'user' | 'assistant'; content: string }[]
  const body = {
    model, messages, stream: false, temperature: 0.3, max_tokens: HEALTH_MAX_TOKENS,
    ...reasoningFor(model, isAnsweringPractice(chat)), ...providerFor(model), usage: { include: true },
  }
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST', headers: openRouterHeaders(), body: JSON.stringify(body), signal: AbortSignal.timeout(25000), cache: 'no-store',
    })
    let reply = '', usage: StepResult['usage']
    if (res.ok) {
      const j: any = await res.json().catch(() => null)
      reply = String(j?.choices?.[0]?.message?.content ?? '').trim()
      const u = j?.usage
      if (u) usage = { prompt_tokens: u.prompt_tokens, completion_tokens: u.completion_tokens, reasoning_tokens: u.completion_tokens_details?.reasoning_tokens, cost: u.cost }
    }
    return { r: { step: 'first', model, ok: res.ok && reply.length > 0, status: res.status, ms: Date.now() - started, usage }, reply }
  } catch {
    return { r: { step: 'first', model, ok: false, status: 0, ms: Date.now() - started }, reply: '' }
  }
}

/** Turn 1 on the guest first-question model, then the chip follow-up on the main model. Any failure = failure. */
export async function runTutorCheck(forceFail = false): Promise<StepResult[]> {
  const firstModel = forceFail ? BOGUS_MODEL : FAST_MODEL
  const sys: Msg = { role: 'system', content: HEALTH_SYSTEM }
  const a = await call(firstModel, [sys, { role: 'user', content: HEALTH_QUESTION }])
  const steps: StepResult[] = [{ ...a.r, step: 'first' }]
  const prior = a.reply || '2 + 2 = 4'
  const b = await call(FREE_MODEL, [sys, { role: 'user', content: HEALTH_QUESTION }, { role: 'assistant', content: prior }, { role: 'user', content: TRY_ONE_TEXT }])
  steps.push({ ...b.r, step: 'follow_up' })
  return steps
}
