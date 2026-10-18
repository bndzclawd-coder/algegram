// Run: npm run test:child-upsell   (pure logic + server render; no network, no real data)
// Child-privacy rule: no upgrade, trial or pricing CTA for under-13 accounts, including during the free
// Pro week and while the account is still loading. Kids only get "Ask a parent about Pro".
import { test } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { canShowUpsell, freeLimitBody, type Usage } from '../lib/account/upsell'
import SidebarPlan from '../app/components/chat/SidebarPlan'

const UPSELL = /\/upgrade|\/pricing|Keep Pro|free week|Get Pro|Try Pro|free trial|7 days|\$12\.99/i
const noop = () => {}
const user = { email: 'support+test@algegram.xyz' }
const free: Usage = { child: false, plan: 'free', used: 3, limit: 20, remaining: 17 }
const bonus: Usage = { child: false, plan: 'pro', used: 0, limit: null, remaining: null, bonus: true, paid: false, bonusProUntil: new Date(Date.now() + 5 * 864e5).toISOString() }
const render = (usage: Usage | null, trial: boolean | null = true) => renderToStaticMarkup(React.createElement(SidebarPlan, {
  usage, user, authResolved: true, trial, askState: 'idle', askError: '', askParent: noop, upgradeToPro: noop, signOut: noop,
}))

test('canShowUpsell: only a loaded adult, non-center account', () => {
  assert.equal(canShowUpsell(null), false)
  assert.equal(canShowUpsell(undefined), false)
  assert.equal(canShowUpsell({}), false, 'unknown age counts as maybe-a-child')
  assert.equal(canShowUpsell({ child: true }), false)
  assert.equal(canShowUpsell({ child: false, center: 'active' }), false)
  assert.equal(canShowUpsell({ child: false }), true)
})

test('sidebar: under-13 during the free Pro week shows no upgrade CTA', () => {
  for (const trial of [true, false, null]) {
    const html = render({ ...bonus, child: true }, trial)
    assert.doesNotMatch(html, UPSELL, html)
    assert.doesNotMatch(html, /sidebar-pro-cta/)
  }
})

test('sidebar: under-13 on Free shows only "Ask a parent about Pro"', () => {
  const html = render({ ...free, child: true })
  assert.doesNotMatch(html, UPSELL, html)
  assert.match(html, /Ask a parent about Pro/)
})

test('sidebar: loading (signed in, usage not loaded yet) shows no upgrade CTA', () => {
  const html = render(null)
  assert.doesNotMatch(html, UPSELL, html)
})

test('sidebar: missing child flag is treated as a child', () => {
  const { child: _c, ...noFlag } = bonus
  assert.doesNotMatch(render(noFlag as Usage), UPSELL)
  const { child: _d, ...noFlagFree } = free
  assert.doesNotMatch(render(noFlagFree as Usage), UPSELL)
})

test('sidebar: adults still see their CTAs', () => {
  assert.match(render(bonus), /Keep Pro after your free week/)
  assert.match(render(free), /\/upgrade|Pro/)
})

test('chat 429 body: kids get no trial or upgrade text', () => {
  const kid = freeLimitBody(20, true)
  assert.equal(kid.child, true)
  assert.doesNotMatch(kid.error, /Pro|trial|7 days|upgrade/i)
  assert.match(freeLimitBody(20, false).error, /Try Pro free for 7 days/)
})
