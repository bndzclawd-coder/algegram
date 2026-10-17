// Run: npx -y tsx --test scripts/signup-alert.test.ts   (pure logic; fake DB claim + fake sender)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { maybeSendSignupAlert, buildSignupAlert, alertSource, ADMIN_SIGNUPS_URL, type AlertDeps } from '../lib/admin/signup-alert'
import type { RawSignup } from '../lib/admin/signups'

const NOW = new Date('2026-10-17T18:30:00Z')
const base = (o: Partial<RawSignup>): RawSignup => ({ id: crypto.randomUUID(), email: 'jane.doe@example.com', created_at: '2026-10-17T18:25:00Z', ...o })

function fakeDeps(opts: { sendThrows?: boolean; claimError?: boolean } = {}) {
  const claimed = new Set<string>(), sent: { subject: string; text: string }[] = [], logs: string[] = []
  const deps: AlertDeps = {
    claim: async k => opts.claimError ? 'error' : claimed.has(k) ? 'used' : (claimed.add(k), 'claimed'),
    send: async m => { if (opts.sendThrows) throw new Error('provider down: jane.doe@example.com'); sent.push(m) },
    logError: m => logs.push(m),
  }
  return { deps, sent, logs, claimed }
}

test('real adult signup sends exactly one alert with only the allowed fields', async () => {
  const f = fakeDeps()
  const r = base({ birth_year: 1990, signup_attribution: { utm_source: 'instagram', utm_medium: 'social', utm_campaign: 'timer_reel' } })
  assert.equal(await maybeSendSignupAlert(r, f.deps, NOW), 'sent')
  assert.equal(await maybeSendSignupAlert(r, f.deps, NOW), 'duplicate') // confirm route hit twice
  assert.equal(f.sent.length, 1)
  const { subject, text } = f.sent[0]
  assert.equal(subject, 'New real signup')
  assert.equal(text, ['New real signup', '', 'When: Oct 17, 2026, 11:25 AM PT', 'Account type: adult', 'How they found us: Social post (campaign: timer_reel)', '', `Details: ${ADMIN_SIGNUPS_URL}`].join('\n'))
  assert.ok(!text.includes('@') && !/jane|doe|instagram|1990/i.test(text))
})

test('test and owner accounts send nothing and claim nothing', async () => {
  const f = fakeDeps()
  const cases: [Partial<RawSignup>, string][] = [
    [{ email: 'support+qa1017@algegram.xyz' }, 'skipped_test'],
    [{ email: 'qa_parent@example.com' }, 'skipped_test'],
    [{ email: 'qc3@example.com' }, 'skipped_test'],
    [{ email: 'kid@example.com', seat_slug: 'qa_center3', birth_year: 2015 }, 'skipped_test'],
    [{ email: 'a@example.com', signup_attribution: { utm_source: 'pilot', utm_campaign: 'qa_center3' } }, 'skipped_test'],
    [{ email: 'k@example.com', birth_year: 2016, user_metadata: { parent_email: 'support+qa@algegram.xyz' } }, 'skipped_test'],
    [{ email: 'basithcs@gmail.com' }, 'skipped_owner'],
    [{ email: 'bndzclawd@gmail.com' }, 'skipped_owner'],
    [{ email: 'k2@example.com', birth_year: 2016, user_metadata: { parent_email: 'basithcs@gmail.com' } }, 'skipped_owner'],
  ]
  for (const [o, want] of cases) assert.equal(await maybeSendSignupAlert(base(o), f.deps, NOW), want)
  assert.equal(f.sent.length, 0)
  assert.equal(f.claimed.size, 0)
})

test('parent + kid (and siblings) send one alert for the family', async () => {
  const f = fakeDeps()
  const kid = base({ email: 'kid1@example.com', birth_year: 2016, user_metadata: { parent_email: 'Mom@Example.com', parental_consent: true } })
  const sib = base({ email: 'kid2@example.com', birth_year: 2018, user_metadata: { parent_email: 'mom@example.com' } })
  const parent = base({ email: 'mom@example.com', birth_year: 1985 })
  assert.equal(await maybeSendSignupAlert(kid, f.deps, NOW), 'sent')
  assert.equal(await maybeSendSignupAlert(sib, f.deps, NOW), 'duplicate')
  assert.equal(await maybeSendSignupAlert(parent, f.deps, NOW), 'duplicate')
  assert.equal(f.sent.length, 1)
  const t = f.sent[0].text
  assert.match(t, /Account type: kid/)
  assert.ok(!t.includes('@') && !/2016|kid1|mom/i.test(t)) // no kid details or parent email
  // Parent first, kid later: still one.
  const g = fakeDeps()
  assert.equal(await maybeSendSignupAlert(base({ email: 'dad@example.com', birth_year: 1980 }), g.deps, NOW), 'sent')
  assert.equal(await maybeSendSignupAlert(base({ email: 'kid3@example.com', birth_year: 2017, user_metadata: { parent_email: 'dad@example.com' } }), g.deps, NOW), 'duplicate')
  assert.equal(g.sent.length, 1)
})

test('send or claim failure never throws and logs only a generic error', async () => {
  const f = fakeDeps({ sendThrows: true })
  assert.equal(await maybeSendSignupAlert(base({}), f.deps, NOW), 'send_error')
  assert.deepEqual(f.logs, ['[signup-alert] send failed'])
  const g = fakeDeps({ claimError: true })
  assert.equal(await maybeSendSignupAlert(base({}), g.deps, NOW), 'claim_error')
  assert.equal(g.sent.length, 0) // can't guarantee once-only, so don't send
  assert.deepEqual(g.logs, ['[signup-alert] could not record alert'])
})

test('sources are generic: no company or center names', () => {
  assert.equal(alertSource(base({})), 'Direct')
  assert.equal(alertSource(base({ seat_slug: 'mathtowne' })), 'Center link')
  assert.equal(alertSource(base({ comp_reason: 'pilot:irvine_math_academy' })), 'Center link')
  assert.equal(alertSource(base({ signup_attribution: { utm_source: 'pilot', utm_campaign: 'irvine_math_academy' } })), 'Center link')
  assert.equal(alertSource(base({ signup_attribution: { utm_source: 'seo', utm_medium: 'organic', referrer_domain: 'google.com' } })), 'Search')
  assert.equal(alertSource(base({ signup_attribution: { utm_source: 'referrer', referrer_domain: 'reddit.com' } })), 'Another website')
  assert.equal(alertSource(base({ signup_attribution: { ref: 'abc123' } })), 'Referral link')
  assert.equal(alertSource(base({ signup_attribution: { utm_source: 'newsletter', utm_campaign: 'oct' } })), 'Campaign link (campaign: oct)')
  const t = buildSignupAlert({ createdPt: 'x', type: 'center seat', source: 'Center link' }).text
  assert.ok(!/algegram\b(?!\.xyz)/i.test(t.replace(ADMIN_SIGNUPS_URL, '')))
})
