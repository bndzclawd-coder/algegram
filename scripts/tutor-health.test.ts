import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { nextHealthState, ptTime } from '../lib/health/tutor-state'

test('one failure: no email', () => {
  assert.deepEqual(nextHealthState({ consecutive_failures: 0, alerted: false }, false), { state: { consecutive_failures: 1, alerted: false }, action: 'none' })
})
test('second failure in a row: alert once', () => {
  assert.deepEqual(nextHealthState({ consecutive_failures: 1, alerted: false }, false), { state: { consecutive_failures: 2, alerted: true }, action: 'alert' })
})
test('further failures: no repeat alert', () => {
  assert.equal(nextHealthState({ consecutive_failures: 5, alerted: true }, false).action, 'none')
})
test('pass after alert: recovery email and reset', () => {
  assert.deepEqual(nextHealthState({ consecutive_failures: 3, alerted: true }, true), { state: { consecutive_failures: 0, alerted: false }, action: 'recovery' })
})
test('pass after a single blip: no email', () => {
  assert.equal(nextHealthState({ consecutive_failures: 1, alerted: false }, true).action, 'none')
})
test('PT time label', () => {
  assert.match(ptTime(new Date('2026-10-26T16:48:00Z')), /^9:48 AM PT, Mon, Oct 26, 2026$/)
})
test('health follow-up text is exactly the "Try one like this" chip text', () => {
  const chips = readFileSync('app/components/QuickReplyChips.tsx', 'utf8')
  const tutor = readFileSync('lib/health/tutor.ts', 'utf8')
  const chip = chips.match(/label: 'Try one like this', text: '([^']+)'/)![1]
  assert.ok(tutor.includes(`TRY_ONE_TEXT = '${chip}'`))
})
test('health check uses shared production settings, never CRON_SECRET', () => {
  const tutor = readFileSync('lib/health/tutor.ts', 'utf8'), route = readFileSync('app/api/health/tutor/route.ts', 'utf8')
  assert.ok(tutor.includes('reasoningFor(') && tutor.includes('providerFor(') && tutor.includes('FAST_MODEL') && tutor.includes('FREE_MODEL'))
  assert.ok(!route.includes('CRON_SECRET') && route.includes('HEALTHCHECK_SECRET'))
  assert.ok(!/guest_ask_daily|increment_guest_ask|consumeIpQuota/.test(route + tutor))
})
