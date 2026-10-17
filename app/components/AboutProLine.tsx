'use client'
import { useCenterLink } from '@/lib/center/useCenterLink'
import { WHAT_IS_ALGEGRAM_PRO } from '@/lib/about'

/** Pro price + 7-day trial sentence in "What is Algegram?". Hidden only for open-center visitors (they get the
 *  center's Pro). Full-center visitors get a regular Free account, so they still see it, as does everyone else. */
export default function AboutProLine() {
  const c = useCenterLink()
  if (c.loaded && c.center) return null
  return <span data-testid='about-pro-line'>{WHAT_IS_ALGEGRAM_PRO}</span>
}
