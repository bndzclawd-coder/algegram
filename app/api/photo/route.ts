import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { resolvePro } from '@/lib/account/pro'
import { isChildAccount } from '@/lib/account/age-gate'
import { consume } from '@/lib/rate-limit'
import { sniff, stripMetadata } from '@/lib/photo/strip'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Photo help (Pro). The image is read into memory, stripped of metadata, sent once to the model
// through OpenRouter with zero-data-retention routing, and discarded. Never stored, never logged.
const MAX_BYTES = 4 * 1024 * 1024
const PHOTO_MODEL = 'google/gemini-3.5-flash'
const NOT_MATH = 'I can only help with math problems.'
const PROMPT = `You are Layla, Algegram's AI math tutor, reading a photo of a math problem.
Rules:
- If the image shows a person or a face, or does not show a math problem, reply exactly: "${NOT_MATH}" and nothing else.
- Never read out, repeat or mention names, schools, emails, handwriting signatures or any other personal details visible in the image.
- Otherwise: state the problem you see in one line, then give the full worked solution right away with short numbered steps and the final answer. Don't quiz the user before helping. You may end with one optional line inviting them to try a similar next step themselves.
- You are an AI tutor; never claim to be human.
Wrap LaTeX math in $...$ for inline and $$...$$ for display.`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Photo help is part of Pro. Sign up free to try it for 7 days.', guest: true }, { status: 401 })

  const db = createServiceClient()
  const [{ isPro }, child] = await Promise.all([resolvePro(db, user.id), isChildAccount(db, user)])
  if (!isPro) {
    return child
      ? NextResponse.json({ error: 'Photo help is part of Pro. Ask a parent about Pro.', child: true }, { status: 403 })
      : NextResponse.json({ error: 'Photo help is part of Pro.', upgrade: true }, { status: 402 })
  }

  const rl = await consume('photo', user.id, 40, 24 * 60 * 60)
  if (rl === 'limited') return NextResponse.json({ error: 'You have used today’s photo help. Try again tomorrow, or type the problem.' }, { status: 429 })
  if (rl === 'error') return NextResponse.json({ error: 'Please try again in a moment.' }, { status: 503 })

  const len = Number(req.headers.get('content-length') ?? 0)
  if (len > MAX_BYTES + 64 * 1024) return NextResponse.json({ error: 'That photo is too big. Please try a smaller one.' }, { status: 413 })
  const form = await req.formData().catch(() => null)
  const file = form?.get('image')
  if (!(file instanceof Blob) || file.size === 0) return NextResponse.json({ error: 'Please choose a photo.' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'That photo is too big. Please try a smaller one.' }, { status: 413 })

  let raw = Buffer.from(await file.arrayBuffer())
  const type = sniff(raw)
  if (!type) return NextResponse.json({ error: 'Please use a JPG or PNG photo.' }, { status: 415 })
  let clean: Buffer
  try { clean = stripMetadata(raw, type) } catch { return NextResponse.json({ error: 'We couldn’t read that photo. Please try another.' }, { status: 400 }) }
  raw = Buffer.alloc(0)

  let res: Response
  try {
    res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://algegram.xyz', 'X-Title': 'Algegram',
      },
      body: JSON.stringify({
        model: PHOTO_MODEL, stream: true, temperature: 0.2, max_tokens: 2048,
        provider: { data_collection: 'deny', zdr: true, only: ['google-vertex'] },
        messages: [
          { role: 'system', content: PROMPT },
          { role: 'user', content: [
            { type: 'text', text: 'Solve the math problem in this photo.' },
            { type: 'image_url', image_url: { url: `data:image/${type};base64,${clean.toString('base64')}` } },
          ] },
        ],
      }),
    })
  } catch (e) {
    console.error('[photo] request threw', { name: (e as Error)?.name })
    return NextResponse.json({ error: 'The tutor is having trouble right now. Please try again.' }, { status: 502 })
  } finally {
    clean = Buffer.alloc(0)
  }
  if (!res.ok || !res.body) {
    console.error('[photo] request failed', { status: res.status })
    res.body?.cancel().catch(() => {})
    return NextResponse.json({ error: 'The tutor is having trouble right now. Please try again.' }, { status: 502 })
  }
  return new NextResponse(res.body, { status: 200, headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-store' } })
}
