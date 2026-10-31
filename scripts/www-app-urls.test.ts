import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { SITE_URL } from '../lib/site-config'

// User-facing links (Stripe return URLs, signup confirm email, parental consent email) must use the
// canonical www origin, not NEXT_PUBLIC_APP_URL (bare domain, which redirects and has been flaky).
const FILES = ['lib/account/checkout.ts', 'lib/account/subscription-status.ts', 'app/api/stripe/portal/route.ts', 'app/api/auth/signup/route.ts', 'lib/account/consent-email.ts']

test('SITE_URL is the www origin', () => assert.equal(SITE_URL, 'https://www.algegram.xyz'))

test('user-facing URL builders use SITE_URL, not NEXT_PUBLIC_APP_URL', () => {
  for (const f of FILES) {
    const s = readFileSync(f, 'utf8')
    assert.doesNotMatch(s, /NEXT_PUBLIC_APP_URL/, f)
    assert.match(s, /SITE_URL/, f)
  }
  const co = readFileSync('lib/account/checkout.ts', 'utf8')
  assert.match(co, /success_url: `\$\{SITE_URL\}\/chat\?upgraded=1`/)
  assert.match(co, /cancel_url: `\$\{SITE_URL\}\/pricing`/)
})
