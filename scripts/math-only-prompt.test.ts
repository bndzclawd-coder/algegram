// Run: npx -y tsx --test scripts/math-only-prompt.test.ts   (pure prompt check; no network, no AI call)
// Every tutor chat mode must keep Layla on math and redirect off-topic requests kindly.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SYSTEM_PROMPTS, MATH_ONLY_RULE, AI_IDENTITY_RULE } from '../lib/chat/prompts'

test('every chat mode includes the math-only rule and the AI identity rule', () => {
  for (const [mode, p] of Object.entries(SYSTEM_PROMPTS)) {
    assert.ok(p.includes(MATH_ONLY_RULE), `${mode} is missing the math-only rule`)
    assert.ok(p.includes(AI_IDENTITY_RULE), `${mode} is missing the AI identity rule`)
  }
  for (const m of ['math', 'graph', 'explain', 'quiz', 'check']) assert.ok(m in SYSTEM_PROMPTS)
})

test('math-only rule covers off-topic requests, persistence and mixed messages', () => {
  const r = MATH_ONLY_RULE.toLowerCase()
  for (const k of ['only help with math', 'chit-chat', 'jokes', 'stories', 'games', 'entertainment', 'general knowledge', 'other school subjects', 'kindly', 'share a math problem', 'even if they ask again', 'only with the math part', 'trusted adult'])
    assert.ok(r.includes(k), `rule should mention "${k}"`)
})

test('rule asks for no personal details and names no other company or app', () => {
  assert.doesNotMatch(MATH_ONLY_RULE, /\b(name|email|age|address|location)\b/i)
  assert.doesNotMatch(MATH_ONLY_RULE + AI_IDENTITY_RULE, /chatgpt|openai|google|gemini|claude|anthropic|unlimited/i)
})

import { OFF_TOPIC_REPLY, FOLLOW_UP_RULE, PRACTICE_RULE, PRO_PRACTICE_NOTE, FREE_PRACTICE_NOTE, systemPrompt } from '../lib/chat/prompts'
import { guestHistory, isAnsweringPractice } from '../lib/chat/history'
import { lessonAnswerIndex, isPracticeProblem } from '../lib/whiteboard/parse'

test('off-topic reply stays word for word (Reels depend on it)', () => {
  assert.equal(OFF_TOPIC_REPLY, "Hi, I'm Layla, an AI tutor. I can only help with math. Please share a math problem you are working on.")
  assert.ok(MATH_ONLY_RULE.includes(OFF_TOPIC_REPLY))
})

test('follow-ups and practice requests are math in every mode; clarifying question when unsure', () => {
  for (const [mode, p] of Object.entries(SYSTEM_PROMPTS)) {
    assert.ok(p.includes(FOLLOW_UP_RULE), `${mode} is missing the follow-up rule`)
    assert.ok(p.includes(PRACTICE_RULE), `${mode} is missing the practice rule`)
  }
  assert.match(FOLLOW_UP_RULE, /Which step should I explain\?/)
  assert.match(PRACTICE_RULE, /exactly ONE new problem/)
  assert.match(PRACTICE_RULE, /do not show the answer/)
  assert.doesNotMatch(FOLLOW_UP_RULE + PRACTICE_RULE + PRO_PRACTICE_NOTE + FREE_PRACTICE_NOTE, /chatgpt|openai|google|gemini|claude|anthropic|unlimited/i)
})

test('plan notes: Pro gets the Practice link, adult Free one Pro line, under-13 / center / guest neither', () => {
  assert.ok(systemPrompt('math', { plan: 'pro' }).includes('/practice?topic='))
  assert.ok(systemPrompt('math', { plan: 'free' }).includes('/upgrade'))
  for (const ctx of [{ plan: 'free' as const, child: true }, { plan: 'free' as const, center: true }, { plan: 'guest' as const }]) {
    const p = systemPrompt('math', ctx)
    assert.ok(!p.includes('/upgrade') && !p.includes('/practice?topic='), JSON.stringify(ctx))
  }
  assert.equal(systemPrompt('quiz', { plan: 'pro' }), SYSTEM_PROMPTS.quiz)
})

test('guests keep recent history (follow-ups need context)', () => {
  const msgs = [
    { role: 'user' as const, content: 'f(a)=2a^2-3a+1, find f(a+1)-f(a)' },
    { role: 'assistant' as const, content: '... = 4a - 1' },
    { role: 'user' as const, content: 'why?' },
  ]
  assert.deepEqual(guestHistory(msgs), msgs)
  const long = Array.from({ length: 20 }, (_, i) => ({ role: (i % 2 ? 'assistant' : 'user') as 'user' | 'assistant', content: 'x'.repeat(9000) }))
  const h = guestHistory(long)
  assert.ok(h.length <= 8 && h[0].role === 'user' && h.every(m => m.content.length <= 4000))
})

test('whiteboard button stays under the solved answer after a short follow-up reply', () => {
  const solved = '1. Write $f(a+1) = 2(a+1)^2 - 3(a+1) + 1$\n2. Expand: $2a^2 + a$\n3. Subtract: $f(a+1) - f(a) = 4a - 1$'
  const msgs = [
    { role: 'user', content: 'q' }, { role: 'assistant', content: solved },
    { role: 'user', content: 'ok' }, { role: 'assistant', content: 'Which step should I explain?' },
  ]
  assert.equal(lessonAnswerIndex(msgs, false), 1)
  assert.ok(isPracticeProblem('**Try this one:** $g(x) = x^2 + 4x$'))
  assert.equal(lessonAnswerIndex([...msgs, { role: 'user', content: 'more' }, { role: 'assistant', content: '**Try this one:** Let $g(x)=x^2+4x$. Find $g(a+1)-g(a)$.' }], false), 1)
  assert.equal(lessonAnswerIndex([{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'Hello' }], false), -1)
})

test('practice detection: lead-in allowed, trailing invitation on a solved answer is not practice', () => {
  assert.ok(isPracticeProblem('Okay, an easier one. **Try this one:** If $f(x) = 2x + 3$, find $f(a+1) - f(a)$.'))
  const solved = '1. Write $f(a+1) = 2(a+1)^2 - 3(a+1) + 1$\n2. Expand and simplify everything carefully: $2a^2 + a$\n3. Subtract: $f(a+1) - f(a) = 4a - 1$\n\nTry this one: $g(x) = x^2 + 4x$.'
  assert.ok(!isPracticeProblem(solved))
  assert.ok(isAnsweringPractice([{ role: 'assistant', content: '**Try this one:** $g(x)=x^2+4x$' }, { role: 'user', content: '2a+5' }]))
  assert.ok(!isAnsweringPractice([{ role: 'assistant', content: solved }, { role: 'user', content: 'why?' }]))
})

import { QUICK_REPLIES, showQuickReplies } from '../app/components/QuickReplyChips'

test('quick-reply chips: labels in order, only under finished math answers', () => {
  assert.deepEqual(QUICK_REPLIES.map(q => q.label), ['Try one like this', 'Easier', 'Harder', 'Explain simpler'])
  assert.deepEqual(QUICK_REPLIES.map(q => q.text), ['Give me one like this to try', 'Give me an easier one', 'Give me a harder one', 'Explain it simpler'])
  const solved = '1. Write $f(a+1) = 2(a+1)^2 - 3(a+1) + 1$\n2. Expand: $2a^2 + a$\n3. Subtract: $f(a+1) - f(a) = 4a - 1$'
  assert.ok(showQuickReplies(solved))
  assert.ok(!showQuickReplies(OFF_TOPIC_REPLY))
  assert.ok(!showQuickReplies('Which step should I explain?'))
  assert.ok(!showQuickReplies('**Try this one:** Let $g(x)=x^2+4x$. Find $g(a+1)-g(a)$.'))
  assert.ok(!showQuickReplies('⚠️ Free limit reached'))
})

test('work-check messages get a short think', () => {
  for (const q of ['is 4a+1 right?', 'I got 4a - 1 is that correct', 'where did I go wrong, I got 2a² + 4a', 'i got 4a+1 is that right'])
    assert.ok(isAnsweringPractice([{ role: 'assistant', content: 'x' }, { role: 'user', content: q }]), q)
  for (const q of ['why?', 'explain it simpler', 'tell me a joke'])
    assert.ok(!isAnsweringPractice([{ role: 'assistant', content: 'x' }, { role: 'user', content: q }]), q)
})

import { PRACTICE_CLOSING } from '../lib/chat/prompts'
import { cleanReplyText, cleanReplyStream } from '../lib/chat/clean'

test('practice problems use one fixed closing line', () => {
  assert.equal(PRACTICE_CLOSING, "Send me your answer when you're ready.")
  assert.ok(PRACTICE_RULE.includes(PRACTICE_CLOSING))
  assert.doesNotMatch(PRACTICE_RULE + PRO_PRACTICE_NOTE + FOLLOW_UP_RULE, /answert/i)
})

test('reply cleanup fixes "answert" as a whole word only and never touches math', () => {
  assert.equal(cleanReplyText('Send me your answert!'), 'Send me your answer!')
  assert.equal(cleanReplyText('Answert: $x = 7$'), 'Answer: $x = 7$')
  for (const s of ['$answerty = 2$', 'answerts', '$f(a+1) - f(a) = 4a - 1$', 'x = answer + t']) assert.equal(cleanReplyText(s), s)
})

test('stream cleanup fixes a word split across chunks and keeps every other character', async () => {
  const ev = (c: string) => `data: ${JSON.stringify({ choices: [{ delta: { content: c } }] })}\n\n`
  const parts = [': OPENROUTER PROCESSING\n\n', ev('**Try this one:** $5x - 8 = 27$. Send me your answ'), ev('ert when you'), ev("'re ready."), 'data: [DONE]\n\n']
  const enc = new TextEncoder()
  const src = new ReadableStream<Uint8Array>({ start(c) { for (const p of parts) c.enqueue(enc.encode(p)); c.close() } })
  const text = await new Response(cleanReplyStream(src)).text()
  let out = ''
  for (const line of text.split('\n')) if (line.startsWith('data: ') && !line.includes('[DONE]')) out += JSON.parse(line.slice(6)).choices[0].delta.content
  assert.equal(out, "**Try this one:** $5x - 8 = 27$. Send me your answer when you're ready.")
  assert.ok(text.includes('data: [DONE]'))
})
