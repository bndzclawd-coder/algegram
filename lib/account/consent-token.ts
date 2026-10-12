import { createHash } from 'crypto'
import type { createServiceClient } from '@/lib/supabase/server'

type Db = ReturnType<typeof createServiceClient>
export const USED_LINK_ERROR = 'This link has already been used.'

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** 'used' | 'unused' | 'error'. Callers must fail closed on 'error'. */
export async function tokenStatus(db: Db, token: string): Promise<'used' | 'unused' | 'error'> {
  const { data, error } = await db.from('consent_tokens_used').select('token_hash').eq('token_hash', hashToken(token)).maybeSingle()
  if (error) { console.error('[consent] token lookup failed', { code: error.code }); return 'error' }
  return data ? 'used' : 'unused'
}

/** Atomically claims the token (primary key insert). Only one caller can ever get 'claimed'. */
export async function claimToken(db: Db, token: string, action: 'approve' | 'decline'): Promise<'claimed' | 'used' | 'error'> {
  const { error } = await db.from('consent_tokens_used').insert({ token_hash: hashToken(token), action })
  if (!error) return 'claimed'
  if (error.code === '23505') return 'used'
  console.error('[consent] token claim failed', { code: error.code })
  return 'error'
}

/** Releases a claim when the approve action failed before changing anything, so the parent can retry. */
export async function releaseToken(db: Db, token: string): Promise<void> {
  const { error } = await db.from('consent_tokens_used').delete().eq('token_hash', hashToken(token))
  if (error) console.error('[consent] token release failed', { code: error.code })
}
