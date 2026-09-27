import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/stripe'

const FREE_LIMIT = PLANS.free.messagesPerDay
// Multiple free models as fallback — OpenRouter picks first available
const FREE_MODELS = [
  'qwen/qwen3.8-27b:free',
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
]
const PRO_DEFAULT_MODEL = 'qwen/qwen3-14b'
const GUEST_LIMIT = 5

const SYSTEM_PROMPTS: Record<string, string> = {
  math: `You are Algegram, an expert math tutor. Solve problems step by step with clear explanations. Wrap all LaTeX math in $...$ for inline and $$...$$ for display.`,
  graph: `You are Algegram. Describe and render functions with LaTeX. Wrap math in $...$ and $$...$$.`,
  explain: `You are Algegram. Explain mathematical concepts clearly. Use examples. Wrap math in $...$ and $$...$$.`,
  check: `You are Algegram. Check the user's math work. Identify errors. Wrap math in $...$ and $$...$$.`,
}

async function callOpenRouter(models: string[], model: string | undefined, messages: object[], mode: string) {
  const body: Record<string, unknown> = {
    messages: [{ role: 'system', content: SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.math }, ...messages],
    stream: true,
    temperature: 0.3,
    max_tokens: 2048,
  }
  if (model) {
    body.model = model
  } else {
    body.models = models
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

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const guestCount = parseInt(req.headers.get('x-guest-count') || '0', 10)
    if (guestCount >= GUEST_LIMIT) {
      return NextResponse.json(
        { error: 'Sign up free to keep solving — no credit card needed.', signup: true },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { messages, mode } = body

    const orRes = await callOpenRouter(FREE_MODELS, undefined, messages, mode)

    if (!orRes.ok) {
      const errText = await orRes.text()
      console.error('OpenRouter guest error:', orRes.status, errText)
      return NextResponse.json({ error: 'AI error', detail: errText }, { status: 502 })
    }

    return new NextResponse(orRes.body, {
      status: 200,
      headers: {
        'X-Plan': 'guest',
        'X-Guest-Used': String(guestCount + 1),
        'X-Guest-Limit': String(GUEST_LIMIT),
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      }
    })
  }

  const db = createServiceClient()

  const { data: sub } = await db
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', user.id)
    .single()

  const isPro = sub?.plan === 'pro' && sub?.status === 'active'

  if (!isPro) {
    const today = new Date().toISOString().split('T')[0]
    const { data: usage } = await db
      .from('usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('day', today)
      .single()

    const count = usage?.count ?? 0
    if (count >= FREE_LIMIT) {
      return NextResponse.json(
        { error: `Free limit reached (${FREE_LIMIT}/day). Upgrade to Pro for unlimited messages.`, upgrade: true },
        { status: 429 }
      )
    }

    await db.from('usage').upsert(
      { user_id: user.id, day: today, count: count + 1 },
      { onConflict: 'user_id,day' }
    )
  }

  const body = await req.json()
  const { messages, model: requestedModel, mode } = body

  const model = isPro ? (requestedModel || PRO_DEFAULT_MODEL) : undefined
  const models = isPro ? undefined : FREE_MODELS

  const orRes = await callOpenRouter(models || FREE_MODELS, model, messages, mode)

  if (!orRes.ok) {
    const err = await orRes.text()
    console.error('OpenRouter error:', orRes.status, err)
    return NextResponse.json({ error: `AI error: ${err}` }, { status: 502 })
  }

  const headers = new Headers()
  headers.set('Content-Type', 'text/event-stream')
  headers.set('Cache-Control', 'no-cache')
  headers.set('X-Plan', isPro ? 'pro' : 'free')
  if (!isPro) {
    const today = new Date().toISOString().split('T')[0]
    const { data: usage } = await db.from('usage').select('count').eq('user_id', user.id).eq('day', today).single()
    headers.set('X-Messages-Used', String(usage?.count ?? 1))
    headers.set('X-Messages-Limit', String(FREE_LIMIT))
  }

  return new NextResponse(orRes.body, { status: 200, headers })
}
