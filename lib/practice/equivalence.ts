// Answer checking without eval(): a tiny math parser + numeric sampling.
// kinds: 'number' (value), 'expression' (in x), 'set' (comma-separated numbers, order-free),
// 'antiderivative' (expression in x, equal up to an additive constant).
export type AnswerKind = 'number' | 'expression' | 'set' | 'antiderivative'

type Node = (vars: Record<string, number>) => number
const FUNCS: Record<string, (a: number) => number> = {
  sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan, ln: Math.log, log: Math.log10,
  exp: Math.exp, abs: Math.abs,
}

export function normalize(raw: string): string {
  let s = String(raw ?? '').trim().toLowerCase()
  s = s.replace(/\$/g, '')
    .replace(/\\left|\\right/g, '')
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)')
    .replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)')
    .replace(/\\cdot|\\times|×|·/g, '*').replace(/÷/g, '/')
    .replace(/\\pi|π/g, 'pi').replace(/√/g, 'sqrt')
    .replace(/[−–—]/g, '-').replace(/²/g, '^2').replace(/³/g, '^3')
    .replace(/\\/g, '').replace(/[{}]/g, m => (m === '{' ? '(' : ')'))
    .replace(/\s+/g, '')
  s = s.replace(/^(y|f\(x\)|f'\(x\)|dy\/dx|x|answer)=/, '')
  s = s.replace(/\+c$/, '')
  return s
}

function parse(src: string): Node {
  let i = 0
  const peek = () => src[i]
  const eat = (c: string) => (src[i] === c ? (i++, true) : false)
  function primary(): Node {
    if (eat('(')) { const e = expr(); if (!eat(')')) throw new Error('paren'); return e }
    const num = /^(\d+\.?\d*|\.\d+)/.exec(src.slice(i))
    if (num) { i += num[0].length; const v = parseFloat(num[0]); return () => v }
    const id = /^[a-z]+/.exec(src.slice(i))
    if (id) {
      const name = id[0]
      for (const f of Object.keys(FUNCS)) if (name.startsWith(f)) {
        i += f.length
        const arg = unary(); const fn = FUNCS[f]; return v => fn(arg(v))
      }
      if (name.startsWith('pi')) { i += 2; return () => Math.PI }
      i += 1
      const c = name[0]
      if (c === 'e') return () => Math.E
      if (c === 'x') return v => { if (!('x' in v)) throw new Error('var'); return v.x }
      throw new Error('unknown ' + c)
    }
    throw new Error('unexpected ' + peek())
  }
  function power(): Node {
    const base = primary()
    if (eat('^')) { const ex = unary(); return v => Math.pow(base(v), ex(v)) }
    return base
  }
  function postfix(): Node {
    const p = power()
    if (eat('%')) return v => p(v) / 100
    return p
  }
  function unary(): Node {
    if (eat('-')) { const u = unary(); return v => -u(v) }
    if (eat('+')) return unary()
    return postfix()
  }
  function term(): Node {
    let left = unary()
    for (;;) {
      if (eat('*')) { const l = left, r = unary(); left = v => l(v) * r(v) }
      else if (eat('/')) { const l = left, r = unary(); left = v => l(v) / r(v) }
      else if (i < src.length && /[0-9a-z(.]/.test(peek())) { const l = left, r = postfix(); left = v => l(v) * r(v) } // implicit
      else return left
    }
  }
  function expr(): Node {
    let left = term()
    for (;;) {
      if (eat('+')) { const l = left, r = term(); left = v => l(v) + r(v) }
      else if (eat('-')) { const l = left, r = term(); left = v => l(v) - r(v) }
      else return left
    }
  }
  const e = expr()
  if (i !== src.length) throw new Error('trailing')
  return e
}

export function compile(raw: string): Node | null {
  const s = normalize(raw)
  if (!s || s.length > 200) return null
  try { return parse(s) } catch { return null }
}

const close = (a: number, b: number) =>
  Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b)) + 1e-9
const SAMPLES = [0.37, 1.13, 1.91, 2.47, 3.29]

function numValue(raw: string): number | null {
  const n = compile(raw)
  if (!n) return null
  try { const v = n({}); return Number.isFinite(v) ? v : null } catch { return null }
}

/** true / false, or null when the answer could not be parsed (caller may fall back to text match). */
export function isEquivalent(user: string, expected: string, kind: AnswerKind): boolean | null {
  if (kind === 'set') {
    const split = (s: string) => normalize(s).replace(/x=/g, '').split(/,|;|or|and/).filter(Boolean)
    const a = split(user).map(numValue), b = split(expected).map(numValue)
    if (a.some(v => v === null) || b.some(v => v === null)) return null
    if (a.length !== b.length) return false
    const rest = [...(b as number[])]
    for (const v of a as number[]) {
      const k = rest.findIndex(w => close(v, w)); if (k < 0) return false; rest.splice(k, 1)
    }
    return true
  }
  if (kind === 'number') {
    const a = numValue(user), b = numValue(expected)
    if (a === null || b === null) return null
    return close(a, b)
  }
  const fa = compile(user), fb = compile(expected)
  if (!fa || !fb) return null
  try {
    const diffs = SAMPLES.map(x => fa({ x }) - fb({ x }))
    if (diffs.some(d => !Number.isFinite(d))) return null
    return kind === 'antiderivative' ? diffs.every(d => close(d, diffs[0])) : diffs.every(d => close(d, 0))
  } catch { return null }
}

export function checkAnswer(user: string, expected: string, kind: AnswerKind): boolean {
  const r = isEquivalent(user, expected, kind)
  if (r !== null) return r
  return normalize(user) !== '' && normalize(user) === normalize(expected)
}
