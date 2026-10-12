#!/usr/bin/env node
// Server-only. Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/grant-comp-pro.mjs <user_id> <days> [reason]
import { createClient } from '@supabase/supabase-js'
const [userId, daysArg, reason = null] = process.argv.slice(2)
const days = Number(daysArg)
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!userId || !Number.isInteger(days) || !url || !key) {
  console.error('Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/grant-comp-pro.mjs <user_id> <days> [reason]')
  process.exit(1)
}
const db = createClient(url, key, { auth: { persistSession: false } })
const { data, error } = await db.rpc('grant_comp_pro', { p_user_id: userId, p_days: days, p_reason: reason })
if (error) { console.error('Failed:', error.message); process.exit(1) }
console.log(`Comp Pro granted to ${userId} until ${data}`)
