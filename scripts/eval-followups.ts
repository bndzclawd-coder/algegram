// Live eval for Layla's chat rules: follow-ups, one-at-a-time practice, checking work, and off-topic refusals.
// Core cases: Customer Success's 22-case list (plus room additions), merged with the owner's phrases.
// Run after every change to lib/chat/prompts.ts, against a deploy, with a TEST account (never a real user):
//   AG_BASE=https://www.algegram.xyz AG_COOKIE='sb-...-auth-token=...' AG_EXPECT_PLAN=pro npm run eval:followups
// Without AG_COOKIE the run is a guest (5 questions per browser, 15 per network every 4 hours), so use
// AG_GUEST_SAMPLE=1 to run the 14-case guest sample. Other options:
//   AG_GROUPS=practice,explain   only these groups      AG_OUT=out.json      save every reply
//   AG_ATTEMPT_REPEAT=3          repeat the attempt check   AG_RESET_EVERY=18 AG_RESET_CMD='...'  run a
//   command every N messages (e.g. reset a Free TEST account's daily count; Free allows 20 a day).
// Exit code 1 if any case fails.
import { writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { OFF_TOPIC_REPLY, PRACTICE_CLOSING } from '../lib/chat/prompts'
import { isPracticeProblem } from '../lib/whiteboard/parse'

type Msg = { role: 'user' | 'assistant'; content: string }
const BASE = (process.env.AG_BASE || 'https://www.algegram.xyz').replace(/\/$/, '')
const COOKIE = process.env.AG_COOKIE || ''
const EXPECT_PLAN = process.env.AG_EXPECT_PLAN || ''
const ONLY = (process.env.AG_GROUPS || '').split(',').filter(Boolean)
const RESET_EVERY = Number(process.env.AG_RESET_EVERY || 0)
const RESET_CMD = process.env.AG_RESET_CMD || ''
const GUEST_SAMPLE = process.env.AG_GUEST_SAMPLE === '1'

const PROBLEM = 'f(a) = 2a^2 - 3a + 1. Find f(a+1) - f(a).'
// cs: number in the Customer Success list. Groups set the pass rule.
type Case = { q: string; cs?: number }
export const CASES: Record<string, Case[]> = {
  practice: [
    { q: 'give me more example for me to try', cs: 1 }, { q: 'can u give more questions', cs: 2 }, { q: 'another one like this', cs: 3 },
    { q: 'give me practice', cs: 4 }, { q: 'one more pls', cs: 5 }, { q: 'can you make it harder', cs: 6 }, { q: 'give me an easier one', cs: 7 },
    { q: 'can you quiz me on this?', cs: 23 }, { q: 'give me more questions like this' }, { q: 'more practice please' }, { q: 'give me another one' },
    { q: 'more like this' }, { q: 'one more' }, { q: 'harder one' }, { q: 'easier pls' }, { q: 'make it harder' }, { q: 'make it easier' },
    { q: 'quiz me' }, { q: 'Give me one like this to try' }, { q: 'Give me a harder one' },
  ],
  explain: [
    { q: 'why?', cs: 8 }, { q: "I don't get step 3", cs: 9 }, { q: 'explain it simpler', cs: 10 }, { q: 'why do we subtract f(a)?', cs: 11 },
    { q: 'what does f(a+1) mean', cs: 12 }, { q: "can you explain it like I'm 10", cs: 13 }, { q: 'give me a hint', cs: 24 }, { q: 'show another way', cs: 25 },
    { q: "explain it like I'm in 6th grade", cs: 26 }, { q: "I don't get it", cs: 27 }, { q: 'explain step 4' }, { q: "what's f(a)?" },
    { q: 'how did you get 4a?' }, { q: 'can you go slower' }, { q: 'why do we subtract' }, { q: 'explain step 2 again' }, { q: 'i dont get it' },
    { q: 'show me a different way' }, { q: 'what does f(a) mean' }, { q: 'is this on tests' }, { q: 'why did you do that step?' }, { q: 'explain simpler' },
  ],
  picture: [{ q: 'show me with a picture', cs: 14 }],
  checkwork: [
    { q: 'is 4a+1 right?', cs: 15 }, { q: 'I got 4a - 1 is that correct', cs: 16 }, { q: 'where did I go wrong, I got 2a² + 4a', cs: 17 },
    { q: 'i got 4a+1 is that right' }, { q: 'is my answer right' },
  ],
  vague: [
    { q: 'huh', cs: 18 }, { q: 'ok what next', cs: 19 }, { q: "I'm stuck", cs: 20 }, { q: 'ok' }, { q: 'thx' }, { q: 'ok next' }, { q: 'this part?' }, { q: 'the middle one' },
  ],
  refused: [
    { q: 'tell me a joke about cats', cs: 21 }, { q: "what's your favorite game", cs: 22 }, { q: 'tell me a joke' }, { q: 'write my essay' }, { q: 'whats the weather' },
  ],
}
// Guest sample (fits the guest network limit with the opening question): CS cases across every group.
const GUEST_CASES: Record<string, number[]> = { practice: [1, 2, 6], explain: [8, 9, 10], picture: [14], checkwork: [15, 16], vague: [18, 19], refused: [21, 22] }

const REDIRECT = /another math problem|do you have another (math )?(problem|question)/i
const norm = (s: string) => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim()
const isRefusal = (r: string) => norm(r).replace(/^"|"$/g, '') === norm(OFF_TOPIC_REPLY)
const flat = (r: string) => r.replace(/[{}$\\]/g, '').replace(/\s+/g, '')

let sent = 0
async function ask(messages: Msg[]): Promise<{ status: number; plan: string | null; reply: string }> {
  if (RESET_EVERY && RESET_CMD && sent > 0 && sent % RESET_EVERY === 0) execSync(RESET_CMD, { stdio: 'ignore' })
  sent++
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

type Result = { group: string; cs?: number; input: string; pass: boolean; why: string; reply: string }
const results: Result[] = []
function rec(group: string, c: Case, reply: string, pass: boolean, why: string) {
  results.push({ group, cs: c.cs, input: c.q, pass, why, reply })
  console.log(`${pass ? 'PASS' : 'FAIL'} [${group}${c.cs ? ' #' + c.cs : ''}] ${JSON.stringify(c.q)} -> ${norm(reply).slice(0, 170)}`)
}
const want = (g: string) => ONLY.length === 0 || ONLY.includes(g)
const pick = (g: string) => GUEST_SAMPLE ? CASES[g].filter(c => c.cs && GUEST_CASES[g]?.includes(c.cs)) : CASES[g]

async function main() {
  const first = await ask([{ role: 'user', content: PROBLEM }])
  if (first.status !== 200) throw new Error(`solve failed: ${first.status} ${first.reply}`)
  const plan = first.plan || 'unknown'
  if (EXPECT_PLAN && plan !== EXPECT_PLAN) throw new Error(`expected plan ${EXPECT_PLAN}, got ${plan}`)
  const solved = first.reply
  rec('solve', { q: PROBLEM }, solved, /4a-1/.test(flat(solved)), 'answer 4a - 1')
  const base: Msg[] = [{ role: 'user', content: PROBLEM }, { role: 'assistant', content: solved }]

  // Plan rule applied to every reply: no upgrade/trial line on Pro or guest; Practice link only on Pro.
  const planRule = (r: string): string | null => {
    const upsell = /\/upgrade|free trial|\btry pro\b|upgrade to pro/i.test(r)
    const practiceLink = /\/practice\?topic=/.test(r)
    if (/unlimited/i.test(r)) return 'says unlimited'
    if (/\banswert\b/i.test(r)) return 'typo: answert'
    if (plan !== 'free' && upsell) return 'upgrade line'
    if (plan !== 'pro' && practiceLink) return 'Practice link on non-Pro'
    return null
  }
  const run = async (group: string, judge: (r: string, c: Case) => [boolean, string]) => {
    if (!want(group)) return
    for (const c of pick(group)) {
      const r = (await ask([...base, { role: 'user', content: c.q }])).reply
      let [ok, why] = r.startsWith('{') ? [false, 'error: ' + r.slice(0, 120)] as [boolean, string] : judge(r, c)
      if (REDIRECT.test(r)) { ok = false; why = 'generic redirect' }
      const pr = planRule(r); if (pr) { ok = false; why = pr }
      rec(group, c, r, ok, why)
    }
  }
  await run('practice', r => {
    const marker = isPracticeProblem(r), reveals = /(the|final) answer (is|:)|answer:\s*\$|solution:/i.test(r)
    const link = /\/practice\?topic=/.test(r)
    const closing = norm(r).includes(norm(PRACTICE_CLOSING))
    const ok = marker && closing && !reveals && !isRefusal(r) && (plan !== 'pro' || link)
    return [ok, `oneProblem=${marker} closingLine=${closing} reveals=${reveals} practiceLink=${link}`]
  })
  await run('explain', r => {
    const ok = !isRefusal(r) && !isPracticeProblem(r)
    return [ok, ok ? 're-explains (or asks which step)' : 'refusal or switched to a new problem']
  })
  await run('picture', r => {
    const ok = /watch layla explain this/i.test(r) && !isRefusal(r)
    return [ok, ok ? 'offers the whiteboard lesson' : 'no whiteboard offer']
  })
  await run('checkwork', (r, c) => {
    const opening = norm(r).slice(0, 90)
    if (isRefusal(r)) return [false, 'refusal']
    if (/4a - 1 is that correct/.test(c.q)) {
      const ok = /correct|right|yes|well done/i.test(opening) && !/not quite|close|almost|incorrect|not correct/i.test(opening)
      return [ok, ok ? 'confirms the right answer' : 'did not confirm a right answer']
    }
    if (/is my answer right/.test(c.q)) return [true, 'asks for their answer or checks it']
    const saysRight = /^(\W*)(yes|correct|that'?s (right|correct))/i.test(opening)
    const hint = /step|check|sign|distribut|expand|hint|look/i.test(r)
    const ok = !saysRight && hint
    return [ok, `wrongAnswerAccepted=${saysRight} pointsToStep=${hint}`]
  })
  // Acknowledgements right after a solved answer: no practice problem was given yet, so Layla must not refer to one.
  const ACK = /^(ok|okay|thx|thanks|ok next|ok what next|got it)\b/i
  const PHANTOM = /(problem|question|one) i (just )?(gave|sent|showed)|the practice problem (above|i)|try the (practice )?problem (above|i)/i
  await run('vague', (r, c) => {
    if (isRefusal(r)) return [false, 'refusal']
    if (ACK.test(c.q.trim())) {
      const phantom = PHANTOM.test(r)
      const offers = isPracticeProblem(r) || /(want|like|ready for|how about|shall i give you|try) (one|another|a similar|a practice|a new)|one like this|to try\b/i.test(r)
      return [!phantom && offers, `offersOne=${offers} phantomProblem=${phantom}`]
    }
    return [true, 'continues or asks which step']
  })

  if (want('attempt') && !GUEST_SAMPLE) for (let rep = 0; rep < Number(process.env.AG_ATTEMPT_REPEAT || 1); rep++) {
    const prob = '**Try this one:** Let $g(x) = x^2 + 4x$. Find $g(a+1) - g(a)$. Send me your answer!'
    const conv: Msg[] = [...base, { role: 'user', content: 'can u give more questions' }, { role: 'assistant', content: prob }]
    const wrong = (await ask([...conv, { role: 'user', content: '2a+3' }])).reply
    const okW = !/2a\+5/.test(flat(wrong)) && !/^\W*(correct|yes)/i.test(norm(wrong)) && !REDIRECT.test(wrong) && !isRefusal(wrong) && !planRule(wrong)
    rec('attempt', { q: '2a+3 (wrong)' }, wrong, okW, okW ? 'hint, answer held back' : 'accepted, gave answer, or redirected')
    const right = (await ask([...conv, { role: 'user', content: '2a+5' }])).reply
    const opening = norm(right).slice(0, 80)
    const okR = /correct|right|yes|great|nice|well done/i.test(opening) && !/close|not quite|almost/i.test(opening) && !planRule(right)
    rec('attempt', { q: '2a+5 (right)' }, right, okR, `opening=${JSON.stringify(opening.slice(0, 40))} practiceLink=${/\/practice\?topic=/.test(right)} upgradeLine=${/\/upgrade/.test(right)}`)
  }
  if (want('refused')) {
    for (const c of pick('refused')) {
      const r = (await ask([{ role: 'user', content: c.q }])).reply
      rec('refused-fresh', c, r, isRefusal(r), isRefusal(r) ? 'exact refusal' : 'not the exact refusal')
    }
    for (const c of pick('refused')) {
      const r = (await ask([...base, { role: 'user', content: c.q }])).reply
      rec('refused-after-math', c, r, isRefusal(r), isRefusal(r) ? 'exact refusal' : 'not the exact refusal')
    }
  }
  const groups = Array.from(new Set(results.map(r => r.group)))
  const summary = Object.fromEntries(groups.map(g => {
    const rs = results.filter(r => r.group === g); return [g, `${rs.filter(r => r.pass).length}/${rs.length}`]
  }))
  const cs = results.filter(r => r.cs)
  console.log('\nplan:', plan, JSON.stringify(summary), `CS list: ${cs.filter(r => r.pass).length}/${cs.length}`)
  if (process.env.AG_OUT) writeFileSync(process.env.AG_OUT, JSON.stringify({ base: BASE, plan, summary, cs: `${cs.filter(r => r.pass).length}/${cs.length}`, results }, null, 1))
  process.exit(results.every(r => r.pass) ? 0 : 1)
}
main().catch(e => { console.error(e); process.exit(2) })
