import Link from 'next/link'
import { Fragment, type ReactNode } from 'react'
import { SiteShell } from '@/components/SiteChrome'

// Minimal Markdown for our legal pages: #/##/### headings, paragraphs, - lists, | tables,
// **bold**, *italic*, `code`, [text](url). No raw HTML is rendered.
function inline(s: string, key = 0): ReactNode[] {
  const out: ReactNode[] = []
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g
  let last = 0, m: RegExpExecArray | null, k = key
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index))
    if (m[1]) out.push(<strong key={k++}>{inline(m[1], k * 100)}</strong>)
    else if (m[2]) out.push(<em key={k++}>{m[2]}</em>)
    else if (m[3]) out.push(<code key={k++} style={{ background: 'rgba(255,255,255,.06)', padding: '0 4px', borderRadius: 4 }}>{m[3]}</code>)
    else if (m[4]) {
      const href = m[5]
      out.push(href.startsWith('/') ? <Link key={k++} href={href} style={{ color: 'var(--accent2)' }}>{m[4]}</Link>
        : /^(https?:|mailto:)/.test(href) ? <a key={k++} href={href} style={{ color: 'var(--accent2)' }}>{m[4]}</a> : m[4])
    }
    last = m.index + m[0].length
  }
  if (last < s.length) out.push(s.slice(last))
  return out
}

export function LegalMarkdown({ md }: { md: string }) {
  const lines = md.replace(/\r/g, '').split('\n')
  const blocks: ReactNode[] = []
  let i = 0, k = 0
  const dim = { color: 'var(--text-dim)', lineHeight: 1.75 }
  while (i < lines.length) {
    const l = lines[i]
    if (!l.trim()) { i++; continue }
    const h = /^(#{1,3})\s+(.*)$/.exec(l)
    if (h) {
      const lvl = h[1].length
      const style = lvl === 1 ? { fontSize: '2rem', fontWeight: 800, margin: '0 0 1rem' } : lvl === 2 ? { fontSize: '1.2rem', fontWeight: 700, margin: '2rem 0 .5rem' } : { fontSize: '1.05rem', fontWeight: 700, margin: '1.25rem 0 .4rem' }
      const Tag = (`h${lvl}`) as 'h1' | 'h2' | 'h3'
      blocks.push(<Tag key={k++} style={style}>{inline(h[2])}</Tag>); i++; continue
    }
    if (/^\s*\|/.test(l)) {
      const rows: string[][] = []
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        if (!/^\s*\|[\s:|-]+\|\s*$/.test(lines[i])) rows.push(lines[i].trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()))
        i++
      }
      const [head, ...body] = rows
      blocks.push(
        <div key={k++} style={{ overflowX: 'auto', margin: '1rem 0' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '.9rem' }}>
            <thead><tr>{head.map((c, j) => <th key={j} style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '.5rem' }}>{inline(c)}</th>)}</tr></thead>
            <tbody>{body.map((r, ri) => <tr key={ri}>{r.map((c, j) => <td key={j} style={{ ...dim, borderBottom: '1px solid var(--border)', padding: '.5rem', verticalAlign: 'top' }}>{inline(c)}</td>)}</tr>)}</tbody>
          </table>
        </div>)
      continue
    }
    if (/^\s*[-*]\s+/.test(l)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s+/, '')); i++ }
      blocks.push(<ul key={k++} style={{ ...dim, paddingLeft: '1.25rem', margin: '.5rem 0', listStyle: 'disc' }}>{items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ul>)
      continue
    }
    const para: string[] = []
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|\s*[-*]\s|\s*\|)/.test(lines[i])) { para.push(lines[i].replace(/^>\s?/, '')); i++ }
    blocks.push(<p key={k++} style={{ ...dim, margin: '.6rem 0' }}>{inline(para.join(' '))}</p>)
  }
  return <Fragment>{blocks}</Fragment>
}

export function LegalPage({ md }: { md: string }) {
  return (
    <SiteShell>
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '2.5rem 1rem 4rem' }}>
        <LegalMarkdown md={md} />
      </main>
    </SiteShell>
  )
}
