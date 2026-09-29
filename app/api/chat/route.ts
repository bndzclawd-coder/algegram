import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/stripe'
import { createHmac } from 'crypto'

const FREE_LIMIT = PLANS.free.messagesPerDay

const FREE_MODEL = 'qwen/qwen3.7-plus'
const PRO_DEFAULT_MODEL = 'qwen/qwen3.7-plus'
const GUEST_LIMIT = 5

const SYSTEM_PROMPTS: Record<string, string> = {
  math: `You are Algegram, an expert math tutor. Solve problems step by step with clear explanations. Wrap all LaTeX math in $...$ for inline and $$...$$ for display.`,
  graph: `You are Algegram. Describe and render functions with LaTeX. Wrap math in $...$ and $$...$$.`,
  explain: `You are Algegram. Explain mathematical concepts clearly. Use examples. Wrap math in $...$ and $$...$$.`,
  check: `You are Algegram. Check the user's math work. Identify errors. Wrap math in $...$ and $$...$$.`,
}

function verifyGuestCookie(signed: string): number {
  const secret = process.env.GUEST_COOKIE_SECRET
  if (!secret) return 0
  const lastDot = signed.lastIndexOf('.')
  if (lastDot < 0) return 0
  const value = signed.slice(0, lastDot)
  const mac = signed.slice(lastDot + 1)
  const expected = createHmac('sha256', secret).update(value).digest('hex')
  if (mac.length !== expected.length) return 0
  let diff = 0
  for (let i = 0; i < mac.length; i++) diff |= mac.charCodeAt(i) ^ expected.charCodeAt(i)
  if (diff !== 0) return 0
  const n = parseInt(value, 10)
  return isNaN(n) ? 0 : Math.max(0, n)
}

async function callOpenRouter(model: string, messages: object[], mode: string) {
  const body: Record<string, unknown> = {
    model,
    messages: [{ role: 'system', content: SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.math }, ...messages],
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

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Enforce guest limit via HMAC-signed cookie
    const cookieValue = req.cookies.get('gl')?.value
    const guestCount = cookieValue ? verifyGuestCookie(cookieValue) : 0
    if (guestCount >= GUEST_LIMIT) {
      return NextResponse.json(
        { error: 'You have used your 5 free questions. Sign up to continue.', signup: true },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { messages, mode } = body
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')
    const guestMessages = lastUserMsg ? [lastUserMsg] : messages.slice(-1)
    const orRes = await callOpenRouter(FREE_MODEL, guestMessages, mode || 'math')
    if (!orRes.ok) {
      const errText = await orRes.text()
      console.error('OpenRouter guest error:', orRes.status, errText)
      return NextResponse.json({ error: 'AI error', detail: errText }, { status: 502 })
    }
    return new NextResponse(orRes.body, {
      status: 200,
      headers: {
        'X-Plan': 'guest',
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

  const isPro = sub?.plan === 'pro' && (sub?.status === 'active' || sub?.status === 'trialing')

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
  const model = isPro ? (requestedModel || PRO_DEFAULT_MODEL) : FREE_MODEL

  const orRes = await callOpenRouter(model, messages, mode || 'math')
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

