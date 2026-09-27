import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/stripe'

const FREE_LIMIT = PLANS.free.messagesPerDay  // 20
const FREE_MODEL = 'qwen/qwen3-8b:free'
const PRO_DEFAULT_MODEL = 'qwen/qwen3-14b'

export async function POST(req: NextRequest) {
  // 1. Auth check
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()

  // 2. Get subscription
  const { data: sub } = await db
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', user.id)
    .single()

  const isPro = sub?.plan === 'pro' && sub?.status === 'active'

  // 3. Rate limit free users
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

    // Upsert usage
    await db.from('usage').upsert(
      { user_id: user.id, day: today, count: count + 1 },
      { onConflict: 'user_id,day' }
    )
  }

  // 4. Parse request
  const body = await req.json()
  const { messages, model: requestedModel, mode } = body

  // Model selection — free users locked to free models
  let model = FREE_MODEL
  if (isPro) {
    model = requestedModel || PRO_DEFAULT_MODEL
  }

  // Build system prompt based on mode
  const systemPrompts: Record<string, string> = {
    math: `You are Algegram, an expert math tutor. Solve problems step by step with clear explanations.
Wrap all LaTeX math in $...$ for inline and $$...$$ for display. Show your working clearly.`,
    graph: `You are Algegram. When asked to graph or plot functions, describe the function and provide the equation clearly.
Then render LaTeX. Wrap math in $...$ for inline and $$...$$ for display.`,
    explain: `You are Algegram. Explain mathematical concepts clearly for students.
Use analogies, examples, and visuals where helpful. Wrap math in $...$ for inline, $$...$$ for display.`,
    check: `You are Algegram. Check the user's math work. Identify any errors with precise explanations.
Wrap math in $...$ for inline, $$...$$ for display.`,
  }

  const systemPrompt = systemPrompts[mode] || systemPrompts.math

  // 5. Stream from OpenRouter
  const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://algegram.app',
      'X-Title': 'Algegram',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: true,
      temperature: 0.3,
      max_tokens: 2048,
    }),
  })

  if (!orRes.ok) {
    const err = await orRes.text()
    return NextResponse.json({ error: `AI error: ${err}` }, { status: 502 })
  }

  // Pass through the stream with usage headers
  const headers = new Headers(orRes.headers)
  headers.set('X-Plan', isPro ? 'pro' : 'free')
  if (!isPro) {
    // Re-fetch count for accurate remaining display
    const today = new Date().toISOString().split('T')[0]
    const { data: usage } = await db.from('usage').select('count').eq('user_id', user.id).eq('day', today).single()
    headers.set('X-Messages-Used', String(usage?.count ?? 1))
    headers.set('X-Messages-Limit', String(FREE_LIMIT))
  }

  return new NextResponse(orRes.body, {
    status: 200,
    headers,
  })
}
