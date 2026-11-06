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

test('Nov 4 (x22) and Nov 6 (x16) release at 5 PM PST (-08:00) and their answers check out', () => {
  const nov4 = Date.parse('2026-11-04T17:00:00-08:00'), nov6 = Date.parse('2026-11-06T17:00:00-08:00')
  assert.equal(nextChallenge(nov4 - 1000)?.equation, '(x − 2)/4 = 5')
  assert.equal(releasedChallenges(nov4)[0].solvePath, '/solve/x-minus-2-over-4-equals-5')
  assert.equal(nextChallenge(nov4)?.equation, '(x + 4)/5 = 4')
  assert.equal(releasedChallenges(nov6)[0].solvePath, '/solve/x-plus-4-over-5-equals-4')
  assert.equal(nov4, Date.parse('2026-11-05T01:00:00Z'))
  // Answers: (22 − 2)/4 = 5 and (16 + 4)/5 = 4
  assert.equal((22 - 2) / 4, 5)
  assert.equal((16 + 4) / 5, 4)
  assert.equal(releasedChallenges(nov6).find(c => c.equation === '(x − 2)/4 = 5')?.answer, 'x = 22')
  assert.equal(releasedChallenges(nov6).find(c => c.equation === '(x + 4)/5 = 4')?.answer, 'x = 16')
})

test('Nov 8, 10, 12, and 14 release at 5 PM PST (-08:00), answers check out, and each solvePath exists', () => {
  const nov8 = Date.parse('2026-11-08T17:00:00-08:00')
  const nov10 = Date.parse('2026-11-10T17:00:00-08:00')
  const nov12 = Date.parse('2026-11-12T17:00:00-08:00')
  const nov14 = Date.parse('2026-11-14T17:00:00-08:00')

  assert.equal(nextChallenge(nov8 - 1000)?.equation, '(x + 3)/2 = 8')
  assert.equal(releasedChallenges(nov8)[0].solvePath, '/solve/x-plus-3-over-2-equals-8')
  assert.equal(nextChallenge(nov8)?.equation, '(x − 5)/4 = 3')
  assert.equal(releasedChallenges(nov10)[0].solvePath, '/solve/x-minus-5-over-4-equals-3')
  assert.equal(nextChallenge(nov10)?.equation, '(x + 7)/3 = 5')
  assert.equal(releasedChallenges(nov12)[0].solvePath, '/solve/x-plus-7-over-3-equals-5')
  assert.equal(nextChallenge(nov12)?.equation, '(x − 3)/5 = 2')
  assert.equal(releasedChallenges(nov14)[0].solvePath, '/solve/x-minus-3-over-5-equals-2')

  // Verify math: (13 + 3)/2 = 8, (17 − 5)/4 = 3, (8 + 7)/3 = 5, (13 − 3)/5 = 2
  assert.equal((13 + 3) / 2, 8)
  assert.equal((17 - 5) / 4, 3)
  assert.equal((8 + 7) / 3, 5)
  assert.equal((13 - 3) / 5, 2)

  const solveSrc = readFileSync('app/solve/[topic]/page.tsx', 'utf8')
  for (const slug of ['x-plus-3-over-2-equals-8', 'x-minus-5-over-4-equals-3', 'x-plus-7-over-3-equals-5', 'x-minus-3-over-5-equals-2']) {
    assert.ok(solveSrc.includes(`'${slug}': {`))
  }
})
