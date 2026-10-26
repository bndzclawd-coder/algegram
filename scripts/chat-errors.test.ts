import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { guestCountAfter, stripFailedTurns, chipAnswerIndex } from '../lib/chat/turns'

const A = (c: string) => ({ role: 'assistant' as const, content: c }), U = (c: string) => ({ role: 'user' as const, content: c })
const ERR = A('⚠️ The tutor is having trouble answering right now. Please try again in a moment.')

test('an errored reply does not use a guest question', () => { assert.equal(guestCountAfter(2, false, false), 2) })
test('a successful answer counts', () => { assert.equal(guestCountAfter(2, true, false), 3) })
test('a refusal does not count', () => { assert.equal(guestCountAfter(2, true, true), 2) })
test('failed turns are dropped from history', () => {
  assert.deepEqual(stripFailedTurns([U('Solve 4x + 7 = 31'), A('x = 6'), U('Try one like this'), ERR, U('Easier')]), [U('Solve 4x + 7 = 31'), A('x = 6'), U('Easier')])
})
test('chips stay under the last good answer after an error', () => {
  assert.equal(chipAnswerIndex([U('q'), A('x = 6'), U('Try one like this'), ERR]), 1)
  assert.equal(chipAnswerIndex([U('q'), A('x = 6')]), 1)
  assert.equal(chipAnswerIndex([U('q'), ERR]), -1)
})
test('guest route counts with guestCountAfter and reports remaining on errors', () => {
  const src = readFileSync('app/api/chat/route.ts', 'utf8')
  assert.match(src, /guestCountAfter\(used, ai\.ok, refusal\)/)
  assert.match(src, /X-Guest-Remaining/)
  assert.doesNotMatch(src, /enabled: false/)
})
test('client strips failed turns and only counts on success', () => {
  const src = readFileSync('app/components/HomepageChat.tsx', 'utf8')
  assert.match(src, /stripFailedTurns\(newMessages\)/)
  assert.match(src, /chipAnswerIndex\(messages\)/)
})
