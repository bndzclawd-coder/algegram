// Server-side model allowlist. The client may *request* a model, but only ids listed
// here are ever sent to OpenRouter. Anything else falls back to the plan default.
export const FREE_MODEL = 'qwen/qwen3.7-plus'
// Pro default model: single source of truth; change here once the owner decides.
export const PRO_DEFAULT_MODEL = 'qwen/qwen3.7-plus'

// Matches the Pro model picker in app/chat/page.tsx (the models Pro users can currently choose).
export const PRO_MODELS = [
  { id: 'qwen/qwen3.7-plus', label: 'Qwen3.7 Plus' },
  { id: 'openai/gpt-4o', label: 'GPT-4o' },
  { id: 'anthropic/claude-sonnet-4-5', label: 'Claude Sonnet' },
  { id: 'google/gemini-2.5-flash', label: 'Gemini Flash' },
  { id: 'deepseek/deepseek-r1', label: 'DeepSeek R1' },
] as const

const PRO_MODEL_IDS: ReadonlySet<string> = new Set(PRO_MODELS.map(m => m.id))

export type PlanKind = 'guest' | 'free' | 'pro'

export function resolveModel(plan: PlanKind, requested: unknown): string {
  if (plan !== 'pro') return FREE_MODEL
  return typeof requested === 'string' && PRO_MODEL_IDS.has(requested) ? requested : PRO_DEFAULT_MODEL
}
