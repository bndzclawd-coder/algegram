import { resolvePro } from '@/lib/account/pro'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/plans'
import { maybeSendDailyLimitEmail } from '@/lib/email/lifecycle'
import { MODEL_PROVIDERS, resolveModel, FREE_MODEL, type PlanKind } from '@/lib/models'
import { PRO_FAIR_USE_DAILY } from '@/lib/site-config'
import { SYSTEM_PROMPTS, systemPrompt, type PromptContext } from '@/lib/chat/prompts'
import { isChildAccount } from '@/lib/account/age-gate'
import { guestHistory, isAnsweringPractice } from '@/lib/chat/history'
import { GUEST_LIMIT, guestSecret, readGuestCount, setGuestCount, consumeIpQuota } from '@/lib/guest-limit'

const FREE_LIMIT = PLANS.free.messagesPerDay
const AI_UNAVAILABLE = 'The tutor is having trouble answering right now. Please try again in a moment.'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

function parseBody(raw: unknown): { messages: ChatMessage[]; model: unknown; mode: string; surface?: string } | null {
  if (!raw || typeof raw !== 'object') return null
  const b = raw as Record<string, unknown>
  if (!Array.isArray(b.messages)) return null
  const messages = b.messages
    .filter((m): m is ChatMessage =>
      !!m && typeof m === 'object' &&
      ((m as ChatMessage).role === 'user' || (m as ChatMessage).role === 'assistant') &&
      typeof (m as ChatMessage).content === 'string')
    .map(m => ({ role: m.role, content: m.content }))
  if (messages.length === 0) return null
  const mode = typeof b.mode === 'string' && b.mode in SYSTEM_PROMPTS ? b.mode : 'math'
  return { messages, model: b.model, mode, surface: b.surface === 'home' ? 'home' : undefined }
}

// Every OpenRouter request goes through here, so data_collection: 'deny' is always set.
// Simple problems (short arithmetic / one-variable algebra / percent & fraction work) go to a fast model.
// Same provider (OpenRouter) and the same privacy settings: data_collection 'deny' + zero-data-retention routing.
const FAST_MODEL = 'google/gemini-2.5-flash-lite'
const HARD = /(integra|∫|deriv|d\/dx|limit|lim|matri|eigen|vector|prove|proof|series|sum of|Σ|log|ln|sin|cos|tan|probab|statistic|differential)/i
function isSimpleProblem(text: string): boolean {
  const t = text.trim()
  return t.length > 0 && t.length <= 160 && !HARD.test(t)
}

async function callOpenRouter(model: string, messages: ChatMessage[], mode: string, ctx: PromptContext) {
  const checking = isAnsweringPractice(messages)
  const body = {
    model,
    messages: [{ role: 'system', content: systemPrompt(mode, ctx) }, ...messages],
    stream: true,
    temperature: 0.3,
    max_tokens: checking ? 2600 : 1400,
    // Default model: skip hidden 'thinking' so the first word shows quickly, except when the student is
    // answering a chat practice problem: then a short think lets Layla work it out before judging their answer.
    ...(model === FREE_MODEL ? { reasoning: checking ? { max_tokens: 1024 } : { enabled: false } } : {}),
    // Zero data retention on every request: OpenRouter only routes to endpoints that keep nothing.
    provider: { data_collection: 'deny', zdr: true, only: MODEL_PROVIDERS[model] ?? MODEL_PROVIDERS[FREE_MODEL] },
  }
  return fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://algegram.xyz',
      'X-Title': 'Algegram',
    },
    body: JSON.stringify(body),
  })
}

/** Calls OpenRouter; on failure logs status only (never user content or the raw body) and returns a generic error. */
async function aiStream(plan: PlanKind, model: string, messages: ChatMessage[], mode: string, ctx: PromptContext = { plan }) {
  try {
    const res = await callOpenRouter(model, messages, mode, ctx)
    if (res.ok && res.body) return { ok: true as const, body: res.body }
    console.error('[chat] OpenRouter request failed', { plan, model, status: res.status })
    res.body?.cancel().catch(() => {})
  } catch (e) {
    console.error('[chat] OpenRouter request threw', { plan, model, name: (e as Error)?.name })
  }
  return { ok: false as const, res: NextResponse.json({ error: AI_UNAVAILABLE }, { status: 502 }) }
}

function streamHeaders(plan: PlanKind) {
  return { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Plan': plan }
}

async function handleGuest(req: NextRequest, preParsed?: ReturnType<typeof parseBody>) {
  const secret = guestSecret()
  if (!secret) {
    console.error('[chat] GUEST_COOKIE_SECRET missing; refusing guest requests')
    return NextResponse.json({ error: 'Guest questions are temporarily unavailable. Please sign up or log in to continue.', signup: true }, { status: 503 })
  }

  // No age question for guests: every guest is treated as possibly under 13, so nothing identifying
  // is stored (no email, no question text, no age). Age is asked only at sign-up.
  const used = readGuestCount(req, secret)
  if (used >= GUEST_LIMIT) {
    return NextResponse.json({ error: 'You have used your 5 free questions. Sign up to continue.', signup: true }, { status: 429 })
  }

  const parsed = preParsed ?? parseBody(await req.json().catch(() => null))
  if (!parsed) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

  // Count the question before the answer is returned, so failed calls can't be used to dodge the limit.
  // The network quota check and the AI request start together (speed); a refused quota discards the AI stream.
  const nextUsed = used + 1
  // Recent history is sent so follow-ups ("why?", "another one like this") are read in context.
  // Still nothing is stored; the guest counter counts every message as before.
  const history = guestHistory(parsed.messages)
  const lastUser = [...history].reverse().find(m => m.role === 'user')
  const model = lastUser && parsed.mode === 'math' && history.length <= 1 && isSimpleProblem(lastUser.content) ? FAST_MODEL : resolveModel('guest', parsed.model)
  const [ipCheck, ai] = await Promise.all([
    consumeIpQuota(req),
    aiStream('guest', model, history, parsed.mode, { plan: 'guest' }),
  ])
  if (ipCheck !== 'ok') {
    if (ai.ok) ai.body.cancel().catch(() => {})
    return ipCheck === 'error'
      ? NextResponse.json({ error: 'Guest questions are temporarily unavailable. Please sign up or log in to continue.', signup: true }, { status: 503 })
      : NextResponse.json({ error: 'Too many free questions from this network. Sign up to continue.', signup: true }, { status: 429 })
  }
  const res = ai.ok
    ? new NextResponse(ai.body, { status: 200, headers: { ...streamHeaders('guest'), 'X-Guest-Remaining': String(GUEST_LIMIT - nextUsed) } })
    : ai.res
  setGuestCount(res, secret, nextUsed)
  if (req.cookies.get('ga')) res.cookies.set('ga', '', { path: '/', maxAge: 0 }) // drop the retired #24 age cookie
  return res
}

export async function POST(req: NextRequest) {
  // No Supabase session cookie at all: definitely a guest, skip the auth round trip.
  if (!req.cookies.getAll().some(c => c.name.startsWith('sb-') && c.name.includes('auth-token'))) return handleGuest(req)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return handleGuest(req)

  const parsed = parseBody(await req.json().catch(() => null))
  if (!parsed) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

  const db = createServiceClient()

  // Server-verified age gate: accounts created by calling Supabase signUp directly (anon key)
  // have no user_profiles row and cannot chat until they confirm their age server-side.
  const { data: profile, error: profErr } = await db.from('user_profiles').select('age_verified').eq('user_id', user.id).maybeSingle()
  if (profErr) {
    console.error('[chat] profile lookup failed', { code: profErr.code })
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 503 })
  }
  if (!profile?.age_verified) {
    // Signed in but no verified age (older accounts) asking from the homepage box: serve it like a
    // guest question (5-question counter, guest age screen, no DB writes) instead of a dead end.
    if (parsed.surface === 'home') return handleGuest(req, parsed)
    return NextResponse.json(
      profile
        ? { error: "Algegram needs a parent's OK for users under 13. Your account is safe! Ask a grown-up to help: [Get a parent's OK →](/auth/age)", ageRequired: true }
        : { error: 'Please confirm your birth year to continue: [Confirm birth year →](/auth/age)', ageRequired: true },
      { status: 403 }
    )
  }

  const { isPro, center } = await resolvePro(db, user.id)
  const plan: PlanKind = isPro ? 'pro' : 'free'

  let usedToday: number | null = null
  if (!isPro) {
    const today = new Date().toISOString().split('T')[0]
    // Atomic check-and-increment (supabase/migrations/20261011010000_atomic_usage_increment.sql).
    const { data, error } = await db.rpc('increment_usage', { p_user_id: user.id, p_day: today, p_limit: FREE_LIMIT })
    if (error) {
      console.error('[chat] increment_usage failed', { code: error.code })
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 503 })
    }
    if (data === null || data === undefined) {
      return NextResponse.json(
        { error: `Free limit reached (${FREE_LIMIT}/day). Try Pro free for 7 days for more help.`, upgrade: true },
        { status: 429 }
      )
    }
    usedToday = Number(data)
    if (usedToday === FREE_LIMIT) {
      maybeSendDailyLimitEmail(db, user).catch(() => console.error('[chat] limit email failed'))
    }
  }

  // Pro fair use: premium (non-free) models count toward PRO_FAIR_USE_DAILY; past it, fall back to FREE_MODEL.
  let model = resolveModel(plan, parsed.model)
  let fairUseFallback = false
  if (isPro && model !== FREE_MODEL) {
    const { data, error } = await db.rpc('increment_premium_usage', {
      p_user_id: user.id, p_day: new Date().toISOString().split('T')[0], p_limit: PRO_FAIR_USE_DAILY,
    })
    if (error) console.error('[chat] increment_premium_usage failed', { code: error.code })
    if (error || data === null || data === undefined) { model = FREE_MODEL; fairUseFallback = true }
  }

  // Free plan (or Pro on the default model): simple problems use the fast model.
  const lastAsk = [...parsed.messages].reverse().find(m => m.role === 'user')
  if (model === FREE_MODEL && parsed.mode === 'math' && lastAsk && isSimpleProblem(lastAsk.content) && parsed.messages.length <= 2) model = FAST_MODEL
  const child = !isPro && parsed.mode === 'math' ? await isChildAccount(db, user).catch(() => true) : false
  const ai = await aiStream(plan, model, parsed.messages, parsed.mode, { plan, child, center: !!center })
  if (!ai.ok) return ai.res

  const headers = new Headers(streamHeaders(plan))
  if (fairUseFallback) headers.set('X-Fair-Use-Fallback', '1')
  if (usedToday !== null) {
    headers.set('X-Messages-Used', String(usedToday))
    headers.set('X-Messages-Limit', String(FREE_LIMIT))
  }
  return new NextResponse(ai.body, { status: 200, headers })
}
