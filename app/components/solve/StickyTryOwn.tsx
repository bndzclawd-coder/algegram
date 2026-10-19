'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { TRY_OWN_HREF, TRY_OWN_LABEL } from '@/lib/solve-cta'

/**
 * Small screens only: a bottom bar with the same button, shown only once the inline button (which sits after
 * the answer check) has scrolled above the screen, so it never covers the solution. No tracking, no storage.
 */
export default function StickyTryOwn() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const el = document.getElementById('try-own')
    if (!el) return
    const on = () => setShow(el.getBoundingClientRect().bottom < 0)
    on()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on) }
  }, [])
  if (!show) return null
  return (
    <div className='sticky-try-own' data-testid='sticky-try-own'
      style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50, padding: '0.6rem 0.9rem calc(0.6rem + env(safe-area-inset-bottom))', background: 'rgba(12,12,20,.94)', borderTop: '1px solid rgba(108,99,255,.35)' }}>
      <Link href={TRY_OWN_HREF} style={{ display: 'block', textAlign: 'center', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.8rem', borderRadius: '12px', fontWeight: 800, fontSize: '1rem', textDecoration: 'none' }}>
        {TRY_OWN_LABEL} →
      </Link>
      <style>{`@media (min-width: 768px) { .sticky-try-own { display: none !important; } }`}</style>
    </div>
  )
}
