import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/plans'
import { maybeSendDailyLimitEmail } from '@/lib/email/lifecycle'
import { resolveModel, FREE_MODEL, type PlanKind } from '@/lib/models'
import { PRO_FAIR_USE_DAILY } from '@/lib/site-config'
import { GUEST_LIMIT, guestSecret, readGuestCount, setGuestCount, consumeIpQuota } from '@/lib/guest-limit'

const FREE_LIMIT = PLANS.free.messagesPerDay
const AI_UNAVAILABLE = 'The tutor is having trouble answering right now. Please try again in a moment.'

const SYSTEM_PROMPTS: Record<string, string> = {
  math: `You are Algegram, an expert math tutor. Solve problems step by step with clear explanations. Wrap all LaTeX math in $...$ for inline and $$...$$ for display.`,
  graph: `You are Algegram. Describe and render functions with LaTeX. Wrap math in $...$ and $$...$$.`,
  explain: `You are Algegram. Explain mathematical concepts clearly. Use examples. Wrap math in $...$ and $$...$$.`,
  check: `You are Algegram. Check the user's math work. Identify errors. Wrap math in $...$ and $$...$$.`,
}

type ChatMessage = { role: 'user' | 'assistant'; content: string }

function parseBody(raw: unknown): { messages: ChatMessage[]; model: unknown; mode: string } | null {
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
  return { messages, model: b.model, mode }
}

// Every OpenRouter request goes through here, so data_collection: 'deny' is always set.
async function callOpenRouter(model: string, messages: ChatMessage[], mode: string) {
  const body = {
    model,
    messages: [{ role: 'system', content: SYSTEM_PROMPTS[mode] }, ...messages],
    stream: true,
    temperature: 0.3,
    max_tokens: 2048,
    provider: { data_collection: 'deny' },
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
async function aiStream(plan: PlanKind, model: string, messages: ChatMessage[], mode: string) {
  try {
    const res = await callOpenRouter(model, messages, mode)
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

async function handleGuest(req: NextRequest) {
  const secret = guestSecret()
  if (!secret) {
    console.error('[chat] GUEST_COOKIE_SECRET missing; refusing guest requests')
    return NextResponse.json({ error: 'Guest questions are temporarily unavailable. Please sign up or log in to continue.', signup: true }, { status: 503 })
  }

  const used = readGuestCount(req, secret)
  if (used >= GUEST_LIMIT) {
    return NextResponse.json({ error: 'You have used your 5 free questions. Sign up to continue.', signup: true }, { status: 429 })
  }

  const parsed = parseBody(await req.json().catch(() => null))
  if (!parsed) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

  const ipCheck = await consumeIpQuota(req)
  if (ipCheck === 'error') {
    return NextResponse.json({ error: 'Guest questions are temporarily unavailable. Please sign up or log in to continue.', signup: true }, { status: 503 })
  }
  if (ipCheck === 'limited') {
    return NextResponse.json({ error: 'Too many free questions from this network. Sign up to continue.', signup: true }, { status: 429 })
  }

  // Count the question before calling the AI, so concurrent/failed calls can't be used to dodge the limit.
  const nextUsed = used + 1
  const lastUser = [...parsed.messages].reverse().find(m => m.role === 'user')
  const ai = await aiStream('guest', resolveModel('guest', parsed.model), lastUser ? [lastUser] : parsed.messages.slice(-1), parsed.mode)
  const res = ai.ok
    ? new NextResponse(ai.body, { status: 200, headers: { ...streamHeaders('guest'), 'X-Guest-Remaining': String(GUEST_LIMIT - nextUsed) } })
    : ai.res
  setGuestCount(res, secret, nextUsed)
  return res
}

export async function POST(req: NextRequest) {
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
    return NextResponse.json(
      profile
        ? { error: "Algegram needs a parent's OK for users under 13. Your account is safe! Ask a grown-up to help: [Get a parent's OK →](/auth/age)", ageRequired: true }
        : { error: 'Please confirm your birth year to continue: [Confirm birth year →](/auth/age)', ageRequired: true },
      { status: 403 }
    )
  }

  const { data: sub } = await db
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', user.id)
    .single()

  const isPro = sub?.plan === 'pro' && (sub?.status === 'active' || sub?.status === 'trialing')
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
        { error: `Free limit reached (${FREE_LIMIT}/day). Upgrade to Pro for unlimited messages.`, upgrade: true },
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

  const ai = await aiStream(plan, model, parsed.messages, parsed.mode)
  if (!ai.ok) return ai.res

  const headers = new Headers(streamHeaders(plan))
  if (fairUseFallback) headers.set('X-Fair-Use-Fallback', '1')
  if (usedToday !== null) {
    headers.set('X-Messages-Used', String(usedToday))
    headers.set('X-Messages-Limit', String(FREE_LIMIT))
  }
  return new NextResponse(ai.body, { status: 200, headers })
}
