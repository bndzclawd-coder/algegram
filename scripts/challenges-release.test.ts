import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { releasedChallenges, nextChallenge } from '../lib/challenges/data'

test('Oct 30 challenge goes on top at 5 PM PT and Oct 31 becomes next', () => {
  const before = Date.parse('2026-10-30T16:59:59-07:00'), at = Date.parse('2026-10-30T17:00:00-07:00')
  assert.equal(releasedChallenges(before)[0].equation, '(x − 4)/3 = 5')
  assert.equal(nextChallenge(before)?.dateLabel, 'Fri Oct 30')
  assert.equal(releasedChallenges(at)[0].equation, '(x − 6)/5 = 3')
  assert.equal(nextChallenge(at)?.dateLabel, 'Sat Oct 31')
})

test('/challenges renders per request, not from a build-time or ISR cache', () => {
  const src = readFileSync('app/challenges/page.tsx', 'utf8')
  assert.match(src, /export const dynamic = 'force-dynamic'/)
  assert.doesNotMatch(src, /export const revalidate/)
  assert.doesNotMatch(src, /generateStaticParams|'force-static'/)
})
