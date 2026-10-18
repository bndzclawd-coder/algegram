// Run: npx -y tsx --test scripts/math-only-prompt.test.ts   (pure prompt check; no network, no AI call)
// Every tutor chat mode must keep Layla on math and redirect off-topic requests kindly.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SYSTEM_PROMPTS, MATH_ONLY_RULE, AI_IDENTITY_RULE } from '../lib/chat/prompts'

test('every chat mode includes the math-only rule and the AI identity rule', () => {
  for (const [mode, p] of Object.entries(SYSTEM_PROMPTS)) {
    assert.ok(p.includes(MATH_ONLY_RULE), `${mode} is missing the math-only rule`)
    assert.ok(p.includes(AI_IDENTITY_RULE), `${mode} is missing the AI identity rule`)
  }
  for (const m of ['math', 'graph', 'explain', 'quiz', 'check']) assert.ok(m in SYSTEM_PROMPTS)
})

test('math-only rule covers off-topic requests, persistence and mixed messages', () => {
  const r = MATH_ONLY_RULE.toLowerCase()
  for (const k of ['only help with math', 'chit-chat', 'jokes', 'stories', 'games', 'entertainment', 'general knowledge', 'other school subjects', 'kindly', 'share a math problem', 'even if they ask again', 'only with the math part', 'trusted adult'])
    assert.ok(r.includes(k), `rule should mention "${k}"`)
})

test('rule asks for no personal details and names no other company or app', () => {
  assert.doesNotMatch(MATH_ONLY_RULE, /\b(name|email|age|address|location)\b/i)
  assert.doesNotMatch(MATH_ONLY_RULE + AI_IDENTITY_RULE, /chatgpt|openai|google|gemini|claude|anthropic|unlimited/i)
})
