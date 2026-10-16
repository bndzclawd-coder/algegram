// Local QA: signed fake checkout.session.completed for Center Starter, run through the real
// signature check + webhook branch logic + center matching, against an in-memory fake DB.
// No network writes, no prod rows. Run: npx tsx scripts/qa/center-webhook-test.ts
import Stripe from 'stripe'
import { isCenterSub, syncCenterSubscription, subscriptionFromSession, CENTER_PLAN, centerSeatActive, centerState } from '../../lib/center'

const secret = 'whsec_local_qa_only'
const stripe = new Stripe('sk_test_local_invalid', { apiVersion: '2024-06-20' as any })

// --- in-memory fake supabase ---
const tables: Record<string, any[]> = {
  user_profiles: [
    { user_id: 'u1', comp_reason: 'pilot:test_center_qa', created_at: '2026-10-01' },
    { user_id: 'u2', comp_reason: 'pilot:test_center_qa', created_at: '2026-10-02' },
    { user_id: 'u3', comp_reason: 'pilot:other', created_at: '2026-10-03' },
    { user_id: 'u4', comp_reason: 'pilot:pay_center_qa', comp_pro_until: '2026-10-01T00:00:00Z', created_at: '2026-10-04' },
  ],
  center_pilots: [{ center_slug: 'pay_center_qa', active: true, seat_cap: 10 }],
  center_seats: [],
  center_subscriptions: [],
}
function q(t: string) {
  let rows = tables[t]; const f: any = {
    select: () => f, eq: (k: string, v: any) => { rows = rows.filter(r => r[k] === v); return f },
    in: (k: string, v: any[]) => { rows = rows.filter(r => v.includes(r[k])); return f },
    gt: (k: string, v: any) => { rows = rows.filter(r => r[k] > v); return f },
    order: (k: string) => { rows = [...rows].sort((a, b) => a[k] < b[k] ? -1 : 1); return f },
    limit: (n: number) => { rows = rows.slice(0, n); return f },
    maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
    then: (res: any) => res({ data: rows, error: null }),
    upsert: async (row: any) => { const i = tables[t].findIndex(r => r.stripe_subscription_id === row.stripe_subscription_id); if (i >= 0) tables[t][i] = { ...tables[t][i], ...row }; else tables[t].push(row); return { error: null } },
  }
  return f
}
const db: any = { from: q, auth: { admin: { listUsers: async () => ({ data: { users: [{ id: 'u2', email: 'owner@testcenter.example' }] } }) } } }

function signed(session: any) {
  const payload = JSON.stringify({ id: 'evt_qa', object: 'event', type: 'checkout.session.completed', data: { object: session } })
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret })
  return stripe.webhooks.constructEvent(payload, header, secret)
}

async function handle(ev: Stripe.Event) {
  const session = ev.data.object as Stripe.Checkout.Session
  if (session.metadata?.plan !== CENTER_PLAN) return 'not-center'
  const sub = await stripe.subscriptions.retrieve(String(session.subscription)).catch((e: any) => { console.log('  retrieve failed as expected:', e?.type); return null })
  await syncCenterSubscription(db, sub ?? subscriptionFromSession(session), session)
  return 'center'
}

const base = (id: string, name: string | null, email: string | null) => ({
  id: `cs_qa_${id}`, object: 'checkout.session', mode: 'subscription', subscription: `sub_qa_${id}`, customer: 'cus_qa', payment_status: 'paid',
  metadata: { plan: 'center_starter' }, customer_details: { email },
  custom_fields: name ? [{ key: 'center_name', type: 'text', text: { value: name } }] : [],
  line_items: undefined, amount_total: 5900,
})

;(async () => {
  let ok = true
  const check = (label: string, cond: boolean) => { console.log(`${cond ? 'PASS' : 'FAIL'} ${label}`); ok &&= cond }
  // Bad signature is rejected
  try { stripe.webhooks.constructEvent('{}', 't=1,v1=bad', secret); check('bad signature rejected', false) } catch { check('bad signature rejected', true) }

  check('route: center session handled', await handle(signed(base('a', 'Test Center QA', 'x@unknown.example'))) === 'center')
  const a = tables.center_subscriptions.find(r => r.stripe_subscription_id === 'sub_qa_a')
  check('match by center name -> test_center_qa', a?.center_slug === 'test_center_qa' && a?.match_method === 'center_name' && a?.seats === 10 && a?.status === 'active')
  check('pilot seat u1 now paid', await centerSeatActive(db, 'u1', 'pilot:test_center_qa'))
  check('other center u3 not paid', !(await centerSeatActive(db, 'u3', 'pilot:other')))

  await handle(signed(base('b', 'Some Unknown Center', 'owner@testcenter.example')))
  const b = tables.center_subscriptions.find(r => r.stripe_subscription_id === 'sub_qa_b')
  check('fallback match by payer email', b?.center_slug === 'test_center_qa' && b?.match_method === 'payer_email')

  await handle(signed(base('c', 'Nope Center', 'nobody@nowhere.example')))
  const c = tables.center_subscriptions.find(r => r.stripe_subscription_id === 'sub_qa_c')
  check('unmatched saved as matched=false (and logged)', c?.matched === false && c?.center_slug === null)

  const plain = { ...base('d', null, null), metadata: {} }
  check('non-center session ignored', await handle(signed(plain)) === 'not-center')
  // Per-center pay link: slug from client_reference_id + subscription metadata, validated against center_pilots
  const u4 = tables.user_profiles.find(r => r.user_id === 'u4')
  check('pay-link center: ended pilot before payment', await centerState(db, 'u4', u4, await centerSeatActive(db, 'u4', u4.comp_reason)) === 'ended')
  await handle(signed({ ...base('e', null, null), client_reference_id: 'pay_center_qa', metadata: { plan: 'center_starter', seats: '10', center_slug: 'pay_center_qa' } }))
  const e = tables.center_subscriptions.find(r => r.stripe_subscription_id === 'sub_qa_e')
  check('pay link matched by slug (pay_link)', e?.center_slug === 'pay_center_qa' && e?.match_method === 'pay_link' && e?.status === 'active')
  check('paid center: seat Pro past day 14 (active)', await centerSeatActive(db, 'u4', u4.comp_reason) && await centerState(db, 'u4', u4, true) === 'active')
  const subE = { id: 'sub_qa_e', object: 'subscription', customer: 'cus_qa', status: 'canceled', current_period_end: Math.floor(Date.now() / 1000) + 86400, metadata: { plan: 'center_starter', seats: '10', center_slug: 'pay_center_qa' } }
  const pl = JSON.stringify({ id: 'evt_qa2', object: 'event', type: 'customer.subscription.deleted', data: { object: subE } })
  const ev2 = stripe.webhooks.constructEvent(pl, stripe.webhooks.generateTestHeaderString({ payload: pl, secret }), secret)
  const s2 = ev2.data.object as Stripe.Subscription
  if (isCenterSub(s2)) await syncCenterSubscription(db, s2)
  const paidAfter = await centerSeatActive(db, 'u4', u4.comp_reason)
  check('cancel -> reverts to ended-pilot rule', !paidAfter && await centerState(db, 'u4', u4, paidAfter) === 'ended')
  for (const st of ['unpaid', 'past_due']) {
    await syncCenterSubscription(db, { ...subE, status: st } as any)
    check(`${st} -> not paid`, !(await centerSeatActive(db, 'u4', u4.comp_reason)))
  }
  await handle(signed({ ...base('f', null, null), client_reference_id: 'no_such_center', metadata: { plan: 'center_starter', center_slug: 'no_such_center' } }))
  check('slug without pilot record -> unmatched', tables.center_subscriptions.find(r => r.stripe_subscription_id === 'sub_qa_f')?.matched === false)
  check('isCenterSub via subscription metadata', isCenterSub({ metadata: { plan: 'center_starter' } } as any))
  console.log(ok ? 'ALL PASS' : 'SOME FAILED'); process.exit(ok ? 0 : 1)
})()
