'use client'
import katex from 'katex'

/** Renders text with $...$ / $$...$$ math via KaTeX (escaped HTML, throwOnError off). */
export default function MathText({ text }: { text: string }) {
  const parts = String(text).split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g)
  return (
    <span style={{ whiteSpace: 'pre-wrap' }}>
      {parts.map((p, i) => {
        const display = p.startsWith('$$') && p.endsWith('$$') && p.length > 4
        const inline = !display && p.startsWith('$') && p.endsWith('$') && p.length > 2
        if (!display && !inline) return <span key={i}>{p}</span>
        const src = display ? p.slice(2, -2) : p.slice(1, -1)
        const html = katex.renderToString(src, { displayMode: display, throwOnError: false, strict: 'ignore', trust: false })
        return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />
      })}
    </span>
  )
}
