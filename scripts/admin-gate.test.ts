// Run: npx -y tsx --test scripts/admin-gate.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { adminGate, safeAdminNext, loginUrlFor } from '../lib/admin/signups'

const owner = { email: 'basithcs@gmail.com', email_confirmed_at: '2026-10-01T00:00:00Z' }
const unconfirmedOwner = { email: 'basithcs@gmail.com', email_confirmed_at: null }
const other = { email: 'someone@example.com', email_confirmed_at: '2026-10-01T00:00:00Z' }
const ownersOtherAccount = { email: 'bndzclawd@gmail.com', email_confirmed_at: '2026-10-01T00:00:00Z' }

test('signed out: admin pages go to sign-in with an /admin return path', () => {
  assert.deepEqual(adminGate('/admin/signups', '', null), { action: 'login', next: '/admin/signups' })
  assert.deepEqual(adminGate('/admin/signups', '?all=1', null), { action: 'login', next: '/admin/signups?all=1' })
  assert.deepEqual(adminGate('/admin', '', null), { action: 'login', next: '/admin/signups' })
  assert.equal(loginUrlFor('/admin/signups?all=1'), '/auth/login?next=%2Fadmin%2Fsignups%3Fall%3D1')
})

test('signed out: admin API gets a 404, never a redirect or data', () => {
  assert.deepEqual(adminGate('/api/admin/signups/reveal', '?id=x', null), { action: 'not_found' })
  assert.deepEqual(adminGate('/api/admin/anything', '', undefined), { action: 'not_found' })
})

test('signed in but not the owner: 404 everywhere', () => {
  for (const u of [other, ownersOtherAccount, unconfirmedOwner]) {
    assert.deepEqual(adminGate('/admin/signups', '', u), { action: 'not_found' })
    assert.deepEqual(adminGate('/admin', '', u), { action: 'not_found' })
    assert.deepEqual(adminGate('/api/admin/signups/reveal', '?id=x', u), { action: 'not_found' })
  }
})

test('owner (confirmed allowlisted email) is allowed', () => {
  assert.deepEqual(adminGate('/admin/signups', '', owner), { action: 'allow' })
  assert.deepEqual(adminGate('/api/admin/signups/reveal', '?id=x', { ...owner, email: 'BasithCS@Gmail.com' }), { action: 'allow' })
})

test('return path can never be an open redirect', () => {
  for (const bad of ['//evil.com', '/admin//evil.com', '/admin/../chat', '/admin/%2F%2Fevil.com', 'https://evil.com/admin', '/adminx', '/chat', '/admin/sign ups', '/admin\\evil'])
    assert.equal(safeAdminNext(bad), '/admin/signups', bad)
  assert.equal(safeAdminNext('/admin/signups', '?all=1&next=https://evil.com'), '/admin/signups?all=1')
  assert.equal(safeAdminNext('/admin/signups', '?next=//evil.com'), '/admin/signups')
  assert.equal(safeAdminNext('/admin/signups/'), '/admin/signups')
})
