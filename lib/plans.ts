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
    ],
  },
  pro: {
    name: 'Pro',
    price: 1299, // cents — $12.99/mo
    messagesPerDay: Infinity,
    models: [
      'google/gemini-2.5-flash',
      'anthropic/claude-sonnet-4.5',
      'openai/gpt-4o',
    ],
    features: [
      'Step-by-step solutions',
      'Practice questions on any topic',
      'Quizzes and timed tests',
      'Weak-spot practice built from your mistakes',
      'Layla whiteboard lessons that explain each step',
      'Weekly progress report by email',
    ],
  },
} as const
