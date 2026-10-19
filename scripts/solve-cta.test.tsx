// Run: npm run test:solve-cta   (pure render; no network, no real data)
// /solve -> "Try your own problem free" -> guest chat at /ask. Kids land here: no trial/Pro/upgrade/price
// text, no personal-info fields, and the page's question is never handed to the chat.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TRY_OWN_HREF, TRY_OWN_LABEL, TRY_OWN_LINE } from '../lib/solve-cta'
import TryOwnCta from '../app/components/solve/TryOwnCta'
import HomepageChat, { SignupWall } from '../app/components/HomepageChat'

const BANNED = /\bpro\b|trial|upgrade|pricing|\$\d|price|unlimited|\bAI\b|7 days/i
const PII = /type=["']?(email|tel)|name=["']?(email|name|phone)|autocomplete=["']?(email|name|tel)|placeholder=["'][^"']*(email|your name)/i

test('copy is plain and kid-safe', () => {
  assert.equal(TRY_OWN_LABEL, 'Try your own problem free')
  assert.equal(TRY_OWN_LINE, 'Type any math problem and Layla shows every step.')
  for (const t of [TRY_OWN_LABEL, TRY_OWN_LINE]) assert.doesNotMatch(t, BANNED)
})

test('button goes to the guest chat with no query (no question handed over, attribution untouched)', () => {
  assert.equal(TRY_OWN_HREF, '/ask')
  const html = renderToStaticMarkup(React.createElement(TryOwnCta))
  assert.match(html, /href="\/ask"/)
  assert.doesNotMatch(html, BANNED)
})

test('/solve page puts the button right after the solutions, before FAQ', () => {
  const src = fs.readFileSync('app/solve/[topic]/page.tsx', 'utf8')
  const a = src.indexOf('{data.examples.map('), b = src.indexOf('<TryOwnCta />'), c = src.indexOf('{data.faq && (\n          <section')
  assert.ok(a > 0 && b > a && c > b, 'order: examples -> TryOwnCta -> FAQ')
  assert.doesNotMatch(src, /7 days of Pro|OfferText/)
})

test('kid-safe guest chat: no upgrade text, no photo (Pro) button, no personal-info fields', () => {
  const html = renderToStaticMarkup(React.createElement(HomepageChat, { kidSafe: true, autoFocus: true }))
  assert.doesNotMatch(html, BANNED, html)
  assert.doesNotMatch(html, /Solve from a photo/)
  assert.doesNotMatch(html, PII)
  assert.equal((html.match(/<input/g) || []).length, 0, 'only the textarea')
  const adult = renderToStaticMarkup(React.createElement(HomepageChat, {}))
  assert.match(adult, /Solve from a photo/, 'homepage keeps its camera button')
})

test('kid-safe limit prompt: signup only, no Pro or pricing', () => {
  const kid = renderToStaticMarkup(React.createElement(SignupWall, { onClose: () => {}, kidSafe: true }))
  assert.doesNotMatch(kid, BANNED, kid)
  assert.match(kid, /href="\/auth\/signup"/)
  assert.match(kid, /5 free questions/)
  const normal = renderToStaticMarkup(React.createElement(SignupWall, { onClose: () => {} }))
  assert.match(normal, /\/pricing/, 'homepage wall unchanged')
})
