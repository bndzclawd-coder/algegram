// Run: npm run test:guest-refusal   (pure logic; no network)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { peekRefusal } from '../lib/chat/refusal'
import { OFF_TOPIC_REPLY } from '../lib/chat/off-topic'
import { ptDay, isAskSessionStart } from '../lib/guest-ask'

const sse = (parts: string[]) => {
  const enc = new TextEncoder()
  const chunks = [...parts.map(p => `data: ${JSON.stringify({ choices: [{ delta: { content: p } }] })}\n\n`), 'data: [DONE]\n\n']
  let i = 0
  return new ReadableStream<Uint8Array>({ pull(c) { i < chunks.length ? c.enqueue(enc.encode(chunks[i++])) : c.close() } })
}
const readAll = async (s: ReadableStream<Uint8Array>) => { const r = s.getReader(); const d = new TextDecoder(); let o = ''; for (;;) { const { done, value } = await r.read(); if (done) return o; o += d.decode(value) } }
const split = (t: string, n: number) => t.match(new RegExp(`.{1,${n}}`, 'gs')) as string[]

test('the standard refusal is detected, however it is chunked, and passed through intact', async () => {
  for (const n of [1, 7, 200]) {
    const p = await peekRefusal(sse(split(OFF_TOPIC_REPLY, n)))
    assert.equal(p.refusal, true, `chunk ${n}`)
    assert.ok((await readAll(p.body)).includes('[DONE]'))
  }
})

test('math answers are not refusals and stream through unchanged', async () => {
  const parts = ['1. Subtract 3: ', '$2x = 8$\n', '2. Divide: $x = 4$']
  const p = await peekRefusal(sse(parts))
  assert.equal(p.refusal, false)
  const out = await readAll(p.body)
  for (const x of parts) assert.ok(out.includes(JSON.stringify(x).slice(1, -1)))
})

test('a reply that only resembles the refusal, or other off-topic text, still counts', async () => {
  assert.equal((await peekRefusal(sse(split("Hi, I'm Layla, an AI tutor. Sure, here is a joke.", 5)))).refusal, false)
  assert.equal((await peekRefusal(sse(['Here is a recipe']))).refusal, false)
  assert.equal((await peekRefusal(sse([]))).refusal, false)
})

test('route decides from the tutor reply only; refusals keep the network cap', () => {
  const src = fs.readFileSync('app/api/chat/route.ts', 'utf8')
  assert.match(src, /peekRefusal\(ai\.body\)/)
  assert.match(src, /const counted = guestCountAfter\(used, ai\.ok, refusal\)/)
  assert.ok(src.indexOf('consumeIpQuota(req)') < src.indexOf('peekRefusal('), 'network quota is consumed before the refusal check')
  assert.doesNotMatch(src, /parsed\.refusal|body\.refusal/)
})

test('/ask counter: PT date, first question only, nothing else stored', () => {
  assert.equal(ptDay(new Date('2026-10-19T06:59:00Z')), '2026-10-18')
  assert.equal(ptDay(new Date('2026-10-19T07:01:00Z')), '2026-10-19')
  assert.ok(isAskSessionStart('ask', 1))
  assert.ok(!isAskSessionStart('ask', 3))
  assert.ok(!isAskSessionStart('home', 1))
  assert.ok(!isAskSessionStart(undefined, 1))
  const sql = fs.readFileSync('supabase/migrations/20261019010000_guest_ask_daily.sql', 'utf8')
  assert.match(sql, /day date primary key/); assert.match(sql, /starts int/)
  assert.doesNotMatch(sql, /\b(ip_hash|cookie|session_id|user_agent|question|user_id)\b/i)
  assert.match(sql, /on conflict \(day\) do update/)
})
