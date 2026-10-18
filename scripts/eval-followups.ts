// Live eval for Layla's chat rules (follow-ups, one-at-a-time practice, off-topic refusals).
// Run after every change to lib/chat/prompts.ts, against a deploy, with a signed-in TEST account:
//   AG_BASE=https://www.algegram.xyz AG_COOKIE='sb-...-auth-token=...' AG_EXPECT_PLAN=pro npm run eval:followups
// AG_COOKIE is the Cookie header of a test account session (never a real user's). Without it the
// run is a guest and stops at the 5-question guest limit. AG_OUT=<file.json> saves every reply.
// Each case costs one chat message (Free accounts: 20 a day). Exit code 1 if any case fails.
import { writeFileSync } from 'node:fs'
import { OFF_TOPIC_REPLY } from '../lib/chat/prompts'

type Msg = { role: 'user' | 'assistant'; content: string }
const BASE = (process.env.AG_BASE || 'https://www.algegram.xyz').replace(/\/$/, '')
const COOKIE = process.env.AG_COOKIE || ''
const EXPECT_PLAN = process.env.AG_EXPECT_PLAN || ''
const ONLY = (process.env.AG_GROUPS || '').split(',').filter(Boolean)

const PROBLEM = 'f(a) = 2a^2 - 3a + 1. Find f(a+1) - f(a).'
export const FOLLOW_UPS = [
  'why?', 'explain step 4', 'I don\'t get it', "what's f(a)?", 'how did you get 4a?', 'can you go slower',
  'why do we subtract', 'explain step 2 again', 'i dont get it', 'show me a different way', 'what does f(a) mean',
  'is this on tests', 'i got 4a+1 is that right', 'is my answer right', 'give me a hint', 'why did you do that step?',
  "explain it like I'm in 6th grade", 'explain simpler', 'ok', 'thx', 'ok next',
]
export const PRACTICE = [
  'can u give more questions', 'give me more example for me to try', 'give me practice', 'another one like this',
  'give me more questions like this', 'more practice please', 'give me another one', 'more like this', 'one more',
  'harder one', 'easier pls', 'make it harder', 'make it easier', 'quiz me', 'can you quiz me on this?',
]
export const VAGUE = ['this part?', 'the middle one']
export const OFF_TOPIC = ['tell me a joke', 'write my essay', 'whats the weather']

const REDIRECT = /another math problem you'?d like help with|do you have another (math )?(problem|question)/i
const norm = (s: string) => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim()
const isRefusal = (r: string) => norm(r).replace(/^"|"$/g, '') === norm(OFF_TOPIC_REPLY)

async function ask(messages: Msg[]): Promise<{ status: number; plan: string | null; reply: string }> {
  const res = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(COOKIE ? { Cookie: COOKIE } : {}) },
    body: JSON.stringify({ messages, mode: 'math' }),
  })
  const text = await res.text()
  let reply = ''
  for (const line of text.split('\n')) {
    if (!line.startsWith('data: ') || line.includes('[DONE]')) continue
    try { reply += JSON.parse(line.slice(6)).choices?.[0]?.delta?.content ?? '' } catch {}
  }
  return { status: res.status, plan: res.headers.get('X-Plan'), reply: reply || text.slice(0, 300) }
}

type Result = { group: string; input: string; pass: boolean; why: string; reply: string }
const results: Result[] = []
function rec(group: string, input: string, reply: string, pass: boolean, why: string) {
  results.push({ group, input, pass, why, reply })
  console.log(`${pass ? 'PASS' : 'FAIL'} [${group}] ${JSON.stringify(input)} -> ${norm(reply).slice(0, 160)}`)
}
const want = (g: string) => ONLY.length === 0 || ONLY.includes(g)

async function main() {
  const first = await ask([{ role: 'user', content: PROBLEM }])
  if (first.status !== 200) throw new Error(`solve failed: ${first.status} ${first.reply}`)
  if (EXPECT_PLAN && first.plan !== EXPECT_PLAN) throw new Error(`expected plan ${EXPECT_PLAN}, got ${first.plan}`)
  const solved = first.reply
  rec('solve', PROBLEM, solved, /4\s*a\s*-\s*1/.test(solved.replace(/[{}]/g, '')), 'answer 4a - 1')
  const base: Msg[] = [{ role: 'user', content: PROBLEM }, { role: 'assistant', content: solved }]

  if (want('followup')) for (const q of FOLLOW_UPS) {
    const r = (await ask([...base, { role: 'user', content: q }])).reply
    const ok = !REDIRECT.test(r) && !isRefusal(r) && r.length > 0 && !r.startsWith('{')
    rec('followup', q, r, ok, ok ? 'math reply' : 'redirect/refusal/error')
  }
  if (want('vague')) for (const q of VAGUE) {
    const r = (await ask([...base, { role: 'user', content: q }])).reply
    const ok = !REDIRECT.test(r) && !isRefusal(r) && r.includes('?')
    rec('vague', q, r, ok, ok ? 'math reply or clarifying question' : 'redirect/refusal')
  }
  if (want('practice')) for (const q of PRACTICE) {
    const r = (await ask([...base, { role: 'user', content: q }])).reply
    const marker = /^\s*(\*\*)?\s*try this one/i.test(r)
    const reveals = /(the|final) answer (is|:)|answer:\s*\$|solution:/i.test(r)
    const ok = marker && !reveals && !REDIRECT.test(r) && !isRefusal(r)
    rec('practice', q, r, ok, ok ? 'one problem, no answer' : `marker=${marker} reveals=${reveals}`)
  }
  if (want('attempt')) {
    const prob = '**Try this one:** Let $g(x) = x^2 + 4x$. Find $g(a+1) - g(a)$. Send me your answer!'
    const conv: Msg[] = [...base, { role: 'user', content: 'can u give more questions' }, { role: 'assistant', content: prob }]
    const wrong = (await ask([...conv, { role: 'user', content: '2a+3' }])).reply
    const okW = !/2\s*a\s*\+\s*5/.test(wrong.replace(/[{}$]/g, '')) && !REDIRECT.test(wrong) && !isRefusal(wrong)
    rec('attempt', '2a+3 (wrong)', wrong, okW, okW ? 'hint, answer held back' : 'gave answer or redirected')
    const right = (await ask([...conv, { role: 'user', content: '2a+5' }])).reply
    const link = /\/practice\?topic=functions/.test(right)
    const anyPractice = /\/practice\?topic=/.test(right)
    const opening = norm(right).slice(0, 80)
    const okR = /correct|right|yes|great|nice|well done/i.test(opening) && !/close|not quite|almost/i.test(opening) && !/unlimited/i.test(right) &&
      (first.plan === 'pro' ? anyPractice : !anyPractice)
    rec('attempt', '2a+5 (right)', right, okR, `plan=${first.plan} practiceLink=${anyPractice} functionsTopic=${link} upgradeLine=${/\/upgrade/.test(right)}`)
  }
  if (want('offtopic')) {
    for (const q of OFF_TOPIC) {
      const r = (await ask([{ role: 'user', content: q }])).reply
      rec('offtopic-fresh', q, r, isRefusal(r), isRefusal(r) ? 'exact refusal' : 'not the exact refusal')
    }
    for (const q of OFF_TOPIC) {
      const r = (await ask([...base, { role: 'user', content: q }])).reply
      rec('offtopic-after-math', q, r, isRefusal(r), isRefusal(r) ? 'exact refusal' : 'not the exact refusal')
    }
  }
  const groups = Array.from(new Set(results.map(r => r.group)))
  const summary = Object.fromEntries(groups.map(g => {
    const rs = results.filter(r => r.group === g); return [g, `${rs.filter(r => r.pass).length}/${rs.length}`]
  }))
  console.log('\nplan:', first.plan, JSON.stringify(summary))
  if (process.env.AG_OUT) writeFileSync(process.env.AG_OUT, JSON.stringify({ base: BASE, plan: first.plan, summary, results }, null, 1))
  process.exit(results.every(r => r.pass) ? 0 : 1)
}
main().catch(e => { console.error(e); process.exit(2) })
