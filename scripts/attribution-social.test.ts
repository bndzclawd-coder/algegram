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
