#!/usr/bin/env node
// Signups by source/campaign. Server-only (reads auth.users).
// Usage: SUPABASE_ACCESS_TOKEN=... [SUPABASE_PROJECT_REF=dbfnodlghbbuhveqrpqs] node scripts/signup-report.mjs 2026-10-01 2026-10-31
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
