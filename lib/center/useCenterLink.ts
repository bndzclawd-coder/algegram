'use client'
import { useEffect, useState } from 'react'

type CenterLink = { full: boolean; center: string | null }
let cached: Promise<CenterLink> | null = null
function load() {
  return cached ??= fetch('/api/center/status', { cache: 'no-store' }).then(r => r.json()).catch(() => ({ full: false, center: null }))
}

/** Center-link visitor state. center = display name when joining an open center (no free week / trial text then). */
export function useCenterLink(): CenterLink & { loaded: boolean } {
  const [s, set] = useState<CenterLink & { loaded: boolean }>({ full: false, center: null, loaded: false })
  useEffect(() => {
    const full = new URLSearchParams(window.location.search).get('center') === 'full'
    load().then(d => set({ full: full || !!d.full, center: d.center ?? null, loaded: true }))
  }, [])
  return s
}
