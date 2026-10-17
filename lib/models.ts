// Server-side model allowlist. The client may *request* a model, but only ids listed
// here are ever sent to OpenRouter. Anything else falls back to the plan default.
// Every model here must have a zero-data-retention endpoint on OpenRouter; all requests are sent with zdr: true.
export const FREE_MODEL = 'google/gemini-2.5-flash'
// Pro default model: single source of truth; change here once the owner decides.
export const PRO_DEFAULT_MODEL = 'google/gemini-2.5-flash'

// Matches the Pro model picker in app/chat/page.tsx (the models Pro users can currently choose).
export const PRO_MODELS = [
  { id: 'openai/gpt-4o', label: 'Clear explainer' },
  { id: 'anthropic/claude-sonnet-4.5', label: 'Deep thinker' },
  { id: 'google/gemini-2.5-flash', label: 'Standard' },
] as const

// Provider allowlist per model: only zero-data-retention, no-training endpoints (checked on OpenRouter's ZDR list).
// Requests also set zdr: true and data_collection: 'deny', and fallbacks outside this list are disabled.
export const MODEL_PROVIDERS: Record<string, string[]> = {
  'google/gemini-2.5-flash': ['google-vertex'],
  'google/gemini-2.5-flash-lite': ['google-vertex'],
  'anthropic/claude-sonnet-4.5': ['amazon-bedrock', 'google-vertex'],
  'openai/gpt-4o': ['azure'],
}

const PRO_MODEL_IDS: ReadonlySet<string> = new Set(PRO_MODELS.map(m => m.id))

export type PlanKind = 'guest' | 'free' | 'pro'

export function resolveModel(plan: PlanKind, requested: unknown): string {
  if (plan !== 'pro') return FREE_MODEL
  return typeof requested === 'string' && PRO_MODEL_IDS.has(requested) ? requested : PRO_DEFAULT_MODEL
}
