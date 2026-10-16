'use client'
import { useCenterLink } from '@/lib/center/useCenterLink'

/** Signup offer copy. Center-link visitors never see the free week / trial text. */
export default function OfferText({ normal, center }: { normal: string; center: string }) {
  const c = useCenterLink()
  if (!c.loaded) return <span style={{ visibility: 'hidden' }}>{normal}</span>
  return <>{c.center ? center : normal}</>
}
