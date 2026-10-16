#!/usr/bin/env node
// Signups by source/campaign. Server-only (reads auth.users).
// Usage: SUPABASE_ACCESS_TOKEN=... [STRIPE_SECRET_KEY=...] [SUPABASE_PROJECT_REF=dbfnodlghbbuhveqrpqs] node scripts/signup-report.mjs 2026-10-01 2026-10-31
// With STRIPE_SECRET_KEY the paid section is read live from Stripe (active/trialing); otherwise from the webhook mirror.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const [from, to] = process.argv.slice(2)
const day = /^\d{4}-\d{2}-\d{2}$/
const token = process.env.SUPABASE_ACCESS_TOKEN
const ref = process.env.SUPABASE_PROJECT_REF || 'dbfnodlghbbuhveqrpqs'
if (!day.test(from ?? '') || !day.test(to ?? '') || !token) {
  console.error('Usage: SUPABASE_ACCESS_TOKEN=... node scripts/signup-report.mjs <from YYYY-MM-DD> <to YYYY-MM-DD>')
  process.exit(1)
}
const sql = readFileSync(fileURLToPath(new URL('./signup-report.sql', import.meta.url)), 'utf8')
  .replace(/date '\d{4}-\d{2}-\d{2}' as from_day/, `date '${from}' as from_day`)
  .replace(/date '\d{4}-\d{2}-\d{2}' as to_day/, `date '${to}' as to_day`)
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: sql }),
})
if (!res.ok) { console.error('Query failed:', res.status, await res.text()); process.exit(1) }
const rows = await res.json()
console.log(`Signups ${from} to ${to} (PT), excluding support+ test accounts`)
if (!rows.length) console.log('(none)')
else console.table(rows)
// Every tracked source, including ones with zero signups so far.
const TRACKED = ['instagram', 'tiktok', 'youtube', 'pilot', 'seo', 'referral', 'referrer', '(direct)']
const bySource = Object.fromEntries(TRACKED.map(s => [s, { signups: 0, confirmed: 0 }]))
for (const r of rows) {
  const k = bySource[r.source] ? r.source : 'other'
  bySource[k] ??= { signups: 0, confirmed: 0 }
  bySource[k].signups += Number(r.signups); bySource[k].confirmed += Number(r.confirmed)
}
console.log('By source (referral = our referral links, medium email/inapp; referrer = other websites):')
console.table(bySource)
const total = rows.reduce((n, r) => n + Number(r.signups), 0)
console.log(`Total: ${total}`)

// ---- Paid customers by source (current) ----
async function sqlQuery(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query }),
  })
  if (!r.ok) throw new Error(`Query failed: ${r.status} ${await r.text()}`)
  return r.json()
}
let paid
const stripeKey = process.env.STRIPE_SECRET_KEY
if (stripeKey) {
  const users = new Map() // supabase_user_id -> status
  for (const status of ['active', 'trialing']) {
    let after = ''
    for (;;) {
      const r = await fetch(`https://api.stripe.com/v1/subscriptions?status=${status}&limit=100${after ? `&starting_after=${after}` : ''}`, { headers: { Authorization: `Bearer ${stripeKey}` } })
      if (!r.ok) { console.error('Stripe query failed:', r.status); process.exit(1) }
      const page = await r.json()
      for (const s of page.data) { const id = s.metadata?.supabase_user_id; if (id && /^[0-9a-f-]{36}$/.test(id)) users.set(id, status) }
      if (!page.has_more) break
      after = page.data[page.data.length - 1].id
    }
  }
  const ids = [...users.keys()]
  const attr = ids.length ? await sqlQuery(`select u.id, coalesce(a.signup_attribution->>'ref', a.signup_attribution->>'utm_source', '(direct)') source,
      coalesce(a.signup_attribution->>'utm_campaign', a.signup_attribution->>'referrer_domain', '') campaign_or_referrer
    from auth.users u left join public.user_attribution a on a.user_id = u.id
    where u.id in (${ids.map(i => `'${i}'`).join(',')}) and u.email not ilike 'support+%@algegram.xyz'`) : []
  const agg = {}
  for (const r of attr) {
    const k = `${r.source}|${r.campaign_or_referrer}`
    agg[k] ??= { source: r.source, campaign_or_referrer: r.campaign_or_referrer, active: 0, trialing: 0, total: 0 }
    agg[k][users.get(r.id)]++; agg[k].total++
  }
  paid = Object.values(agg).sort((a, b) => b.total - a.total)
  console.log('\nPaying customers by source (live from Stripe: active + trialing)')
} else {
  paid = await sqlQuery(readFileSync(fileURLToPath(new URL('./paid-by-source.sql', import.meta.url)), 'utf8'))
  console.log('\nPaying customers by source (webhook mirror: active + trialing; set STRIPE_SECRET_KEY for live)')
}
if (!paid.length) console.log('(none)')
else console.table(paid)
