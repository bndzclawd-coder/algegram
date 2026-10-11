// Plan definitions. Kept separate from lib/stripe.ts so client components (e.g. /pricing)
// can import them without pulling the Stripe server SDK into the browser bundle.
export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    messagesPerDay: 20,
    features: [
      '20 messages per day',
      'Algebra & calculus help',
      'LaTeX math rendering',
      'Basic graphing',
    ],
  },
  pro: {
    name: 'Pro',
    price: 1299, // cents — $12.99/mo
    messagesPerDay: Infinity,
    models: [
      'qwen/qwen3-14b',
      'anthropic/claude-sonnet-4-5',
      'openai/gpt-4o',
      'google/gemini-2.0-flash-001',
      'deepseek/deepseek-r1',
    ],
    features: [
      'Unlimited messages',
      'Access to GPT-4o, Claude & more',
      'Full graphing & step-by-step',
      'Conversation history',
      'Priority support',
    ],
  },
} as const
