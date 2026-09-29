'use client'
import { useEffect } from 'react'

/**
 * Loads KaTeX JS client-side and assigns it to window.katex so
 * useMathRenderer hooks throughout the app can call renderToString.
 */
export default function KaTeXRenderer() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const win = window as any
    if (win.katex) return
    import('katex').then((mod) => {
      win.katex = mod.default
    }).catch(() => {})
  }, [])
  return null
}
