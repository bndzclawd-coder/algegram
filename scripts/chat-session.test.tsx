// Run: npm run test:chat-session   (pure logic; no network, no real data)
// /chat -> "Practice more like this" -> back to /chat must keep the conversation, tab-only (sessionStorage).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { CHAT_SESSION_KEY, MAX_STORED_MESSAGES, chatOwner, saveChat, loadChat, clearChat } from '../lib/chat/session-store'
import { renderTextWithLinks } from '../lib/chat/links'

const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), m } }
const convo = [
  { role: 'user' as const, content: 'Solve 2x + 3 = 11' },
  { role: 'assistant' as const, content: '1. Subtract 3: $2x = 8$\n2. Divide by 2: $x = 4$\n\n[Practice more like this →](/practice?topic=linear-equations)' },
]

test('round trip for the same owner, with mode', () => {
  const kv = mem()
  saveChat(chatOwner('abc'), 'explain', convo, kv)
  const got = loadChat(chatOwner('abc'), kv)
  assert.deepEqual(got?.messages, convo)
  assert.equal(got?.mode, 'explain')
})

test('another account or a guest in the same tab never gets it', () => {
  const kv = mem()
  saveChat(chatOwner('abc'), 'math', convo, kv)
  assert.equal(loadChat(chatOwner('xyz'), kv), null)
  assert.equal(loadChat(chatOwner(null), kv), null)
  saveChat(chatOwner(null), 'math', convo, kv)
  assert.equal(loadChat(chatOwner('abc'), kv), null)
  assert.ok(loadChat('guest', kv))
})

test('empty or streaming placeholders are not stored; clear removes it; capped size', () => {
  const kv = mem()
  saveChat('guest', 'math', [{ role: 'user', content: 'hi' }, { role: 'assistant', content: '' }], kv)
  assert.equal(loadChat('guest', kv)?.messages.length, 1)
  saveChat('guest', 'math', [], kv)
  assert.equal(kv.m.has(CHAT_SESSION_KEY), false)
  const many = Array.from({ length: 100 }, (_, i) => ({ role: (i % 2 ? 'assistant' : 'user') as 'user' | 'assistant', content: `m${i}` }))
  saveChat('guest', 'math', many, kv)
  assert.equal(loadChat('guest', kv)?.messages.length, MAX_STORED_MESSAGES)
  clearChat(kv)
  assert.equal(loadChat('guest', kv), null)
})

test('corrupt storage is ignored', () => {
  const kv = mem(); kv.setItem(CHAT_SESSION_KEY, '{nope')
  assert.equal(loadChat('guest', kv), null)
})

test('sessionStorage only: no localStorage and no network in the chat persistence code', () => {
  const src = fs.readFileSync('lib/chat/session-store.ts', 'utf8').replace(/^\s*\/\/.*$/gm, '')
  assert.doesNotMatch(src, /localStorage|fetch\(|sendBeacon|XMLHttpRequest|gtag|analytics/)
  assert.match(src, /sessionStorage/)
  const page = fs.readFileSync('app/chat/page.tsx', 'utf8')
  assert.doesNotMatch(page, /localStorage/)
})

test('"Practice more like this" opens in a new tab so the chat stays open; other links unchanged', () => {
  const html = renderToStaticMarkup(React.createElement('div', null, ...renderTextWithLinks('[Practice more like this →](/practice?topic=linear-equations) and [Upgrade](/upgrade)')))
  assert.match(html, /href="\/practice\?topic=linear-equations" target="_blank" rel="noopener"/)
  assert.match(html, /href="\/upgrade"(?! target)/)
})
