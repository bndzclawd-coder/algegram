// Run: npm run test:attribution-prefetch   (pure logic; no network, no real data)
// Background prefetches of tagged links must never set ag_attr; the first real page view sets it with its
// own landing path. First visit still wins for real Instagram / short-link visits.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { NextRequest, NextResponse } from 'next/server'
import { withAttribution, isPrefetchRequest } from '../lib/attribution/middleware'
import { ATTR_COOKIE, decodeAttribution } from '../lib/attribution/attribution'

const B = 'https://www.algegram.xyz'
const run = (path: string, headers: Record<string, string> = {}) => {
  const req = new NextRequest(B + path, { headers })
  const res = withAttribution(req, NextResponse.next())
  const c = res.cookies.get(ATTR_COOKIE)
  return { attr: c ? decodeAttribution(c.value) : null, ref: res.cookies.get('ag_ref')?.value ?? null }
}
const BANNER = '/?utm_source=seo&utm_medium=organic&utm_campaign=x_over_3_plus_4_equals_10'

test('prefetch headers are recognised', () => {
  const h = (o: Record<string, string>) => new Headers(o)
  assert.ok(isPrefetchRequest(h({ 'next-router-prefetch': '1', rsc: '1' })))
  assert.ok(isPrefetchRequest(h({ purpose: 'prefetch' })))
  assert.ok(isPrefetchRequest(h({ 'sec-purpose': 'prefetch;prerender' })))
  assert.ok(isPrefetchRequest(h({ 'x-moz': 'prefetch' })))
  assert.ok(isPrefetchRequest(h({ 'x-middleware-prefetch': '1' })))
  assert.ok(!isPrefetchRequest(h({ rsc: '1' })), 'a clicked client navigation is a real view')
  assert.ok(!isPrefetchRequest(h({})))
})

test('a prefetch of the tagged banner link sets nothing (the bug)', () => {
  for (const hdr of [{ 'next-router-prefetch': '1', rsc: '1' }, { purpose: 'prefetch' }, { 'sec-purpose': 'prefetch' }]) {
    assert.equal(run(BANNER, hdr).attr, null)
    assert.equal(run('/?ref=abcd2345', hdr).ref, null, 'no referral cookie from a prefetch either')
  }
})

test('direct /solve view: no campaign, so nothing is recorded (direct)', () => {
  assert.equal(run('/solve/x-over-3-plus-4-equals-10').attr, null)
})

test('search visit to /solve records seo with the /solve landing page', () => {
  const a = run('/solve/x-over-3-plus-4-equals-10', { referer: 'https://www.google.com/' }).attr
  assert.equal(a?.utm_source, 'seo')
  assert.equal(a?.landing_path, '/solve/x-over-3-plus-4-equals-10')
  assert.equal(a?.utm_campaign, undefined)
})

test('Instagram short link (/x3 -> /solve?utm...) still records timer_x3, first visit wins', () => {
  const a = run('/solve/x-over-3-plus-4-equals-10?utm_source=instagram&utm_medium=social&utm_campaign=timer_x3').attr
  assert.equal(a?.utm_campaign, 'timer_x3')
  assert.equal(a?.landing_path, '/solve/x-over-3-plus-4-equals-10')
  // An existing cookie is never overwritten, prefetch or not.
  const req = new NextRequest(B + BANNER, { headers: { cookie: `${ATTR_COOKIE}=${encodeURIComponent(JSON.stringify(a))}` } })
  assert.equal(withAttribution(req, NextResponse.next()).cookies.get(ATTR_COOKIE), undefined)
})

test('every tagged <Link> in the app has prefetch={false} (Next hides <Link> prefetches from middleware)', () => {
  const files: string[] = []
  const walk = (d: string) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = `${d}/${e.name}`; if (e.isDirectory()) walk(p); else if (/\.tsx$/.test(e.name)) files.push(p) } }
  walk('app')
  let tagged = 0
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8')
    for (const m of src.matchAll(/<Link\b[^>]*>/gs)) {
      if (!/utm_|[?&]ref=|[?&]src=/.test(m[0])) continue
      tagged++
      assert.match(m[0], /prefetch=\{false\}/, `${f}: ${m[0].slice(0, 100)}`)
    }
  }
  assert.ok(tagged >= 6, `found ${tagged} tagged Links`)
})
