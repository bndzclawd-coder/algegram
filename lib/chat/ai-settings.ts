// Single source of truth for the OpenRouter request settings used by /api/chat AND the hourly tutor health check,
// so the health check exercises exactly what production sends (model ids, ZDR provider routing, reasoning).
import { FREE_MODEL, MODEL_PROVIDERS } from '@/lib/models'

/** Guest model for a first simple question (see isSimpleProblem in app/api/chat/route.ts). */
export const FAST_MODEL = 'google/gemini-3.5-flash-lite'

/** Reasoning setting per model. 3.5 Flash requires reasoning (enabled:false is a 400), so keep it minimal,
 *  except when checking a student's practice answer. Other models get no reasoning param. */
export function reasoningFor(model: string, checking: boolean) {
  return model === FREE_MODEL ? { reasoning: checking ? { max_tokens: 1024 } : { effort: 'minimal' } } : {}
}

/** Zero data retention on every request: only allowlisted ZDR endpoints, no data collection, no fallbacks elsewhere. */
export function providerFor(model: string) {
  return { provider: { data_collection: 'deny', zdr: true, only: MODEL_PROVIDERS[model] ?? MODEL_PROVIDERS[FREE_MODEL] } }
}

export function openRouterHeaders() {
  return {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://algegram.xyz',
    'X-Title': 'Algegram',
  }
}
