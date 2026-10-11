import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'
import type { AnswerKind } from './equivalence'
import type { TopicId } from './topics'

// Answers + solutions travel to the browser only inside an AES-256-GCM sealed token, so they are
// never stored server-side and the client cannot read or alter them. Bound to the user id + expiry.
export type SealedQuestion = { answer: string; kind: AnswerKind; steps: string[]; hint: string }
export type SetPayload = { uid: string; topic: TopicId; mode: 'practice' | 'test'; iat: number; exp: number; qs: SealedQuestion[] }

function key(): Buffer | null {
  const s = process.env.PRACTICE_TOKEN_SECRET || process.env.GUEST_COOKIE_SECRET
  if (!s || s.length < 16) return null
  return createHash('sha256').update('algegram-practice-v1:' + s).digest()
}

export function sealSet(p: SetPayload): string | null {
  const k = key(); if (!k) return null
  const iv = randomBytes(12)
  const c = createCipheriv('aes-256-gcm', k, iv)
  const body = Buffer.concat([c.update(JSON.stringify(p), 'utf8'), c.final()])
  return [iv, c.getAuthTag(), body].map(b => b.toString('base64url')).join('.')
}

export function openSet(token: unknown, uid: string, now = Date.now()): SetPayload | null {
  const k = key(); if (!k || typeof token !== 'string' || token.length > 60000) return null
  try {
    const [iv, tag, body] = token.split('.').map(s => Buffer.from(s, 'base64url'))
    const d = createDecipheriv('aes-256-gcm', k, iv); d.setAuthTag(tag)
    const p = JSON.parse(Buffer.concat([d.update(body), d.final()]).toString('utf8')) as SetPayload
    if (p.uid !== uid || now > p.exp) return null
    return p
  } catch { return null }
}
