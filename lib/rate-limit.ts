import { createHash } from 'crypto'
import type { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// DB-backed rate limits (table public.rate_limit_buckets, see migration 20261011020000).
// PRIVACY: only sha256(secret:kind:day:value) is stored. Never the raw IP/email, never logged,
// never joined with users, question text, or analytics. Rows expire after the window.

function secret(): string | null {
  const s = process.env.RATE_LIMIT_SECRET || process.env.GUEST_COOKIE_SECRET
  return s && s.length >= 16 ? s : null
}

export function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
}

export function bucketKey(kind: string, value: string): string | null {
  const s = secret()
  if (!s) return null
  const day = new Date().toISOString().slice(0, 10)
  return createHash('sha256').update(`${s}:${kind}:${day}:${value}`).digest('hex')
}

/** 'ok' = allowed and counted, 'limited' = over limit, 'error' = could not check (callers fail closed). */
export async function consume(kind: string, value: string, limit: number, windowSeconds: number): Promise<'ok' | 'limited' | 'error'> {
  const key = bucketKey(kind, value)
  if (!key) return 'error'
  const { data, error } = await createServiceClient().rpc('consume_rate_limit', {
    p_bucket: key, p_limit: limit, p_window_seconds: windowSeconds,
  })
  if (error) {
    console.error('[rate-limit] check failed', { kind, code: error.code }) // no key/IP/email in logs
    return 'error'
  }
  return data === true ? 'ok' : 'limited'
}
