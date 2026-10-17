// Run: npx -y tsx --test scripts/admin-signups.test.ts   (pure logic; no network, no real data)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isAdminUser, classify, buildRows, summarize, revealEmail, sourceLabel, planLabel, type RawSignup } from '../lib/admin/signups'

const NOW = new Date('2026-10-17T18:00:00Z') // Sat Oct 17, 11:00 AM PT
const base = (o: Partial<RawSignup>): RawSignup => ({ id: crypto.randomUUID(), email: 'x@example.com', created_at: '2026-10-16T12:00:00Z', ...o })

test('owner gate: only the confirmed allowlisted email', () => {
  assert.equal(isAdminUser({ email: 'basithcs@gmail.com', email_confirmed_at: '2026-10-01' }), true)
  assert.equal(isAdminUser({ email: 'BasithCS@gmail.com ', email_confirmed_at: '2026-10-01' }), true)
  assert.equal(isAdminUser({ email: 'basithcs@gmail.com', email_confirmed_at: null }), false)
  assert.equal(isAdminUser({ email: 'bndzclawd@gmail.com', email_confirmed_at: '2026-10-01' }), false)
  assert.equal(isAdminUser({ email: 'someone@example.com', email_confirmed_at: '2026-10-01' }), false)
  assert.equal(isAdminUser(null), false)
  assert.equal(isAdminUser({ email: 'a@b.co', email_confirmed_at: 'x' }, ['a@b.co']), true)
})

test('test/owner flags', () => {
  assert.equal(classify(base({ email: 'basithcs@gmail.com' })).flag, 'owner')
  assert.equal(classify(base({ email: 'bndzclawd@gmail.com' })).flag, 'owner')
  assert.equal(classify(base({ email: 'support+qa1015adult@algegram.xyz' })).flag, 'test')
  assert.equal(classify(base({ email: 'qa_parent@example.com' })).flag, 'test')
  assert.equal(classify(base({ email: 'qc2@example.com' })).flag, 'test')
  assert.equal(classify(base({ email: 'jane@example.com', seat_slug: 'qa_center3' })).flag, 'test')
  assert.equal(classify(base({ email: 'jane@example.com', signup_attribution: { utm_campaign: 'qa_center3' } })).flag, 'test')
  assert.equal(classify(base({ email: 'qasim@example.com' })).flag, 'real')
  assert.equal(classify(base({ email: 'jane@example.com', signup_attribution: { utm_source: 'instagram' } })).flag, 'real')
})

test('kids: type kid, reveal returns the parent email only', () => {
  const kid = base({ email: 'kid123@example.com', birth_year: 2016, user_metadata: { parent_email: 'mom@example.com' } })
  const parent = base({ email: 'mom@example.com', birth_year: 1985 })
  assert.equal(revealEmail(kid, NOW), 'mom@example.com')
  assert.equal(revealEmail(parent, NOW), 'mom@example.com')
  const rows = buildRows([kid, parent], NOW)
  assert.equal(rows.find(r => r.id === kid.id)!.type, 'kid')
  assert.equal(rows.find(r => r.id === parent.id)!.type, 'parent')
  // Rows carry no email or name at all.
  assert.ok(!JSON.stringify(rows).includes('@'))
  assert.equal(buildRows([base({ birth_year: 1990 })], NOW)[0].type, 'adult')
  assert.equal(buildRows([base({ birth_year: 2016, seat_slug: 'mathtowne' })], NOW)[0].type, 'center seat')
})

test('source and plan labels', () => {
  assert.equal(sourceLabel(base({})), 'Direct')
  assert.equal(sourceLabel(base({ seat_slug: 'mathtowne' })), 'Center link: mathtowne')
  assert.equal(sourceLabel(base({ signup_attribution: { utm_source: 'instagram', utm_medium: 'social', utm_campaign: 'timer' } })), 'Social post · instagram (social) · timer')
  const now = NOW.getTime()
  assert.equal(planLabel(base({}), now), 'Free')
  assert.equal(planLabel(base({ sub_plan: 'pro', sub_status: 'active' }), now), 'Paid Pro')
  assert.match(planLabel(base({ bonus_pro_until: '2026-10-23T03:20:00Z' }), now), /^Free Pro week until Oct 22, 2026$/)
  assert.equal(planLabel(base({ bonus_pro_until: '2026-10-01T00:00:00Z', sub_plan: 'free', sub_status: 'active' }), now), 'Free')
  assert.match(planLabel(base({ comp_pro_until: '2026-10-29T07:00:00Z', comp_reason: 'pilot:x' }), now), /center pilot/)
})

test('summary counts: newest first, tests excluded by default, PT week/month', () => {
  const rows = buildRows([
    base({ email: 'a@example.com', created_at: '2026-10-12T08:00:00Z' }), // Mon 1 AM PT: this week
    base({ email: 'b@example.com', created_at: '2026-10-12T06:00:00Z' }), // Sun 11 PM PT: last week
    base({ email: 'c@example.com', created_at: '2026-10-01T08:00:00Z' }), // Oct 1 1 AM PT
    base({ email: 'd@example.com', created_at: '2026-09-30T08:00:00Z' }), // September
    base({ email: 'support+t@algegram.xyz', created_at: '2026-10-16T08:00:00Z' }),
  ], NOW)
  assert.ok(rows[0].createdAt > rows[1].createdAt)
  assert.deepEqual(summarize(rows, false, NOW), { week: 1, month: 3, all: 4, hidden: 1 })
  assert.deepEqual(summarize(rows, true, NOW), { week: 2, month: 4, all: 5, hidden: 0 })
})
