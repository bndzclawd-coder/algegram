import type { ReactNode } from 'react'

// Renders [label](url) as a link: same-site paths ("/x", not "//") or https:// only. Everything
// else stays plain text. React escapes the label, so no HTML injection.
export function safeHref(url: string): string | null {
  const u = url.trim()
  if (u.startsWith('/') && !u.startsWith('//') && !u.includes('\\')) return u
  if (/^https:\/\/[^\s/]+/i.test(u)) { try { return new URL(u).protocol === 'https:' ? u : null } catch { return null } }
  return null
}

export function renderTextWithLinks(text: string, keyPrefix = 'l'): ReactNode[] {
  const out: ReactNode[] = []
  const re = /\[([^\]\n]{1,200})\]\(([^)\s]{1,500})\)/g
  let last = 0, m: RegExpExecArray | null, i = 0
  while ((m = re.exec(text)) !== null) {
    const href = safeHref(m[2])
    if (!href) continue
    if (m.index > last) out.push(text.slice(last, m.index))
    const external = href.startsWith('https://')
    // "Practice more like this" opens in a new tab so the chat stays open where it was.
    const practice = /^\/practice(?:[?#/]|$)/.test(href)
    out.push(<a key={`${keyPrefix}${i++}`} href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : practice ? { target: '_blank', rel: 'noopener' } : {})}
      style={{ color: 'var(--accent2)', textDecoration: 'underline' }}>{m[1]}</a>)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}
