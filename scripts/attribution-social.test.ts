// Run: npx -y tsx --test scripts/attribution-social.test.ts   (pure logic; no network, no real data)
// Paid/boosted social links must be stored by the first-party ag_attr capture and read as "Social post".
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { attributionFromSearchParams, decodeAttribution, encodeAttribution } from '../lib/attribution/attribution'
import { sourceLabel, type RawSignup } from '../lib/admin/signups'
import { alertSource } from '../lib/admin/signup-alert'

const PATH = '/solve/x-over-3-plus-4-equals-10'
const capture = (qs: string) => {
  const a = attributionFromSearchParams(new URLSearchParams(qs), PATH, null)
  assert.ok(a, `no attribution for ?${qs}`)
  // Round-trip through the cookie encoding exactly as signup reads it.
  return decodeAttribution(encodeAttribution(a!))!
}
const row = (attr: Record<string, unknown>): RawSignup => ({ id: 'u1', email: 'x@example.com', created_at: '2026-10-17T22:00:00Z', signup_attribution: attr })

test('?src=ig-boost maps to social / paid / boost_timer', () => {
  const a = capture('src=ig-boost')
  assert.equal(a.utm_source, 'social')
  assert.equal(a.utm_medium, 'paid')
  assert.equal(a.utm_campaign, 'boost_timer')
  assert.equal(a.landing_path, PATH)
  assert.equal(alertSource(row(a)), 'Social post (campaign: boost_timer)')
  assert.match(sourceLabel(row(a)), /^Social post · social \(paid\) · boost_timer$/)
})

test('utm_source=social&utm_medium=paid reads as Social post', () => {
  const a = capture('utm_source=social&utm_medium=paid')
  assert.equal(alertSource(row(a)), 'Social post')
  assert.match(sourceLabel(row(a)), /^Social post · /)
})

test('utm_source=instagram&utm_medium=paid&utm_campaign=boost_timer reads as Social post', () => {
  const a = capture('utm_source=instagram&utm_medium=paid&utm_campaign=boost_timer')
  assert.deepEqual([a.utm_source, a.utm_medium, a.utm_campaign], ['instagram', 'paid', 'boost_timer'])
  assert.equal(alertSource(row(a)), 'Social post (campaign: boost_timer)')
  assert.equal(sourceLabel(row(a)), 'Social post · instagram (paid) · boost_timer')
})

test('explicit UTM tags win over ?src; unknown or unsafe src values are ignored', () => {
  assert.equal(capture('src=ig-boost&utm_source=newsletter').utm_source, 'newsletter')
  assert.equal(attributionFromSearchParams(new URLSearchParams('src=something-else'), PATH, null), null)
  assert.equal(attributionFromSearchParams(new URLSearchParams('src=kid%40example.com'), PATH, null), null)
})

test('stores only campaign labels, path and date (no question text or personal data)', () => {
  const a = capture('src=ig-boost&q=what+is+2x')
  assert.deepEqual(Object.keys(a).sort(), ['first_seen', 'landing_path', 'utm_campaign', 'utm_medium', 'utm_source'])
})

test('non-social sources are unchanged', () => {
  assert.equal(alertSource(row({ utm_source: 'newsletter', utm_campaign: 'oct' })), 'Campaign link (campaign: oct)')
  assert.equal(sourceLabel(row({ utm_source: 'newsletter', utm_campaign: 'oct' })), 'newsletter · oct')
  assert.equal(alertSource(row({ ref: 'abc12345', utm_source: 'instagram' })), 'Referral link')
})

test('timer Reel links for the Oct 24 / Oct 26 /solve pages read as Social post with their campaign', () => {
  for (const [path, camp] of [['/solve/5x-minus-8-equals-27', 'timer_5x'], ['/solve/x-plus-6-over-2-equals-9', 'timer_x6']]) {
    const a = decodeAttribution(encodeAttribution(attributionFromSearchParams(new URLSearchParams(`utm_source=instagram&utm_medium=social&utm_campaign=${camp}`), path, null)!))!
    assert.equal(a.landing_path, path)
    assert.equal(alertSource(row(a)), `Social post (campaign: ${camp})`)
  }
})

test('timer Reel links for the Oct 29 / Oct 31 /solve pages (/x19, /x14) read as Social post with their campaign', () => {
  for (const [path, camp] of [['/solve/x-minus-4-over-3-equals-5', 'timer_x19'], ['/solve/x-plus-10-over-4-equals-6', 'timer_x14']]) {
    const a = decodeAttribution(encodeAttribution(attributionFromSearchParams(new URLSearchParams(`utm_source=instagram&utm_medium=social&utm_campaign=${camp}`), path, null)!))!
    assert.equal(a.landing_path, path)
    assert.equal(a.utm_campaign, camp)
    assert.equal(alertSource(row(a)), `Social post (campaign: ${camp})`)
  }
})

test('Instagram bio link (/ig -> /challenges) reads as Social post with campaign ig_bio', () => {
  const a = decodeAttribution(encodeAttribution(attributionFromSearchParams(new URLSearchParams('utm_source=instagram&utm_medium=social&utm_campaign=ig_bio'), '/challenges', null)!))!
  assert.equal(a.landing_path, '/challenges')
  assert.equal(a.utm_source, 'instagram')
  assert.equal(a.utm_campaign, 'ig_bio')
  assert.equal(alertSource(row(a)), 'Social post (campaign: ig_bio)')
})
