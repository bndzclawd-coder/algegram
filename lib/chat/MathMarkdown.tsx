'use client'
import { memo, useEffect, useState, type ReactNode } from 'react'
import { renderTextWithLinks } from '@/lib/chat/links'

// Light Markdown (**bold**, _italic_/*italic*, # headings, lists, links) + KaTeX math ($..$, $$..$$, \(..\), \[..\]).
// KaTeX is loaded lazily on first use so it adds nothing to the initial page JS.
type Katex = { renderToString: (s: string, o: object) => string }
let katexMod: Katex | null = null
let katexLoading: Promise<Katex> | null = null
function loadKatex(): Promise<Katex> {
  if (katexMod) return Promise.resolve(katexMod)
  katexLoading ??= import('katex').then(m => (katexMod = (m.default ?? m) as unknown as Katex))
  return katexLoading
}

type Part = { t: 'text' | 'im' | 'dm'; c: string }
export function splitMath(src: string): Part[] {
  const re = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\$(?!\s)((?:[^$\\\n]|\\.)+?)\$/g
  const out: Part[] = []; let last = 0; let m: RegExpExecArray | null
  while ((m = re.exec(src))) {
    if (m.index > last) out.push({ t: 'text', c: src.slice(last, m.index) })
    if (m[1] != null || m[2] != null) out.push({ t: 'dm', c: (m[1] ?? m[2])! })
    else out.push({ t: 'im', c: (m[3] ?? m[4])! })
    last = re.lastIndex
  }
  if (last < src.length) out.push({ t: 'text', c: src.slice(last) })
  return out
}

function inlineMd(s: string, key: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /\*\*([^*\n]+?)\*\*|__([^_\n]+?)__|(?<![\w*])\*([^*\n]+?)\*(?!\w)|(?<!\w)_([^_\n]+?)_(?!\w)/g
  let last = 0, m: RegExpExecArray | null, i = 0
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(...renderTextWithLinks(s.slice(last, m.index), `${key}l${i}-`))
    if (m[1] ?? m[2]) out.push(<strong key={`${key}b${i}`}>{m[1] ?? m[2]}</strong>)
    else out.push(<em key={`${key}e${i}`}>{m[3] ?? m[4]}</em>)
    last = re.lastIndex; i++
  }
  if (last < s.length) out.push(...renderTextWithLinks(s.slice(last), `${key}l${i}-`))
  return out
}

function Text({ c, k }: { c: string; k: string }) {
  // Strip heading markers / bullets at line starts but keep line breaks.
  const lines = c.split('\n')
  return <>{lines.map((ln, i) => {
    const h = /^\s{0,3}#{1,6}\s+(.*)$/.exec(ln)
    const b = /^\s*[-*•]\s+(.*)$/.exec(ln)
    const body = h ? <strong>{inlineMd(h[1], `${k}h${i}`)}</strong> : b ? <>• {inlineMd(b[1], `${k}u${i}`)}</> : inlineMd(ln, `${k}p${i}`)
    return <span key={i}>{body}{i < lines.length - 1 ? '\n' : ''}</span>
  })}</>
}

function MathMarkdownImpl({ text }: { text: string }) {
  const [k, setK] = useState<Katex | null>(katexMod)
  const parts = splitMath(text)
  const hasMath = parts.some(p => p.t !== 'text')
  useEffect(() => { if (hasMath && !k) loadKatex().then(setK).catch(() => {}) }, [hasMath, k])
  return (
    <span style={{ whiteSpace: 'pre-wrap' }}>
      {parts.map((p, i) => {
        if (p.t === 'text') return <Text key={i} c={p.c} k={`t${i}`} />
        const display = p.t === 'dm'
        if (!k) return <span key={i} style={{ fontFamily: 'serif', color: 'var(--accent2)' }}>{p.c.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2').replace(/\\(times|cdot)/g, '×').replace(/\\div/g, '÷').replace(/[{}\\]/g, '')}</span>
        const html = k.renderToString(p.c, { displayMode: display, throwOnError: false })
        return display
          ? <div key={i} style={{ overflowX: 'auto', padding: '0.3rem 0', whiteSpace: 'normal' }} dangerouslySetInnerHTML={{ __html: html }} />
          : <span key={i} style={{ whiteSpace: 'normal' }} dangerouslySetInnerHTML={{ __html: html }} />
      })}
    </span>
  )
}
export const MathMarkdown = memo(MathMarkdownImpl)
