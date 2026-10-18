// Keeps the current /chat conversation across in-app navigation (e.g. chat -> "Practice more like this" -> back).
// Privacy scope: sessionStorage only (this browser tab; gone when the tab closes). Never localStorage, never sent
// to the server or analytics. It holds the same text already on screen; photos are never stored (only the
// "📷 Photo of a math problem" placeholder line is). Tagged with the owner so another account (or a guest) in the
// same tab never sees it; cleared on sign-out.
export type StoredMessage = { role: 'user' | 'assistant'; content: string }
export type StoredChat = { v: 1; owner: string; mode: string; messages: StoredMessage[] }

export const CHAT_SESSION_KEY = 'ag_chat_session_v1'
export const MAX_STORED_MESSAGES = 40
export const MAX_STORED_CHARS = 8000

type KV = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
const store = (): KV | null => { try { return typeof window !== 'undefined' ? window.sessionStorage : null } catch { return null } }

export function chatOwner(userId: string | null | undefined): string {
  return userId ? `u:${userId}` : 'guest'
}

export function saveChat(owner: string, mode: string, messages: StoredMessage[], kv: KV | null = store()): void {
  if (!kv) return
  try {
    const clean = messages
      .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
      .slice(-MAX_STORED_MESSAGES)
      .map(m => ({ role: m.role, content: m.content.slice(0, MAX_STORED_CHARS) }))
    if (!clean.length) { kv.removeItem(CHAT_SESSION_KEY); return }
    kv.setItem(CHAT_SESSION_KEY, JSON.stringify({ v: 1, owner, mode, messages: clean } satisfies StoredChat))
  } catch { /* quota or disabled storage: chat just isn't restored */ }
}

export function loadChat(owner: string, kv: KV | null = store()): StoredChat | null {
  if (!kv) return null
  try {
    const d = JSON.parse(kv.getItem(CHAT_SESSION_KEY) || 'null')
    if (!d || d.v !== 1 || d.owner !== owner || !Array.isArray(d.messages)) return null
    const messages = d.messages.filter((m: any) => (m?.role === 'user' || m?.role === 'assistant') && typeof m?.content === 'string')
      .slice(-MAX_STORED_MESSAGES).map((m: any) => ({ role: m.role, content: m.content.slice(0, MAX_STORED_CHARS) }))
    return messages.length ? { v: 1, owner, mode: typeof d.mode === 'string' ? d.mode : 'math', messages } : null
  } catch { return null }
}

export function clearChat(kv: KV | null = store()): void {
  try { kv?.removeItem(CHAT_SESSION_KEY) } catch {}
}
