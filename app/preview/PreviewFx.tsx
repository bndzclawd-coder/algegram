'use client'
import { useEffect } from 'react'

/** Scroll reveals + phone parallax. No-ops under prefers-reduced-motion. No tracking of any kind. */
export default function PreviewFx() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return }
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target) }
    }), { rootMargin: '0px 0px -10% 0px' })
    els.forEach(e => io.observe(e))

    const phone = document.querySelector<HTMLElement>('[data-parallax]')
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        if (phone) phone.style.setProperty('--py', `${Math.min(window.scrollY, 600) * -0.08}px`)
      })
    }
    const onMove = (e: PointerEvent) => {
      if (!phone || e.pointerType !== 'mouse') return
      const x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5
      phone.style.setProperty('--rx', `${(-y * 6).toFixed(2)}deg`)
      phone.style.setProperty('--ry', `${(x * 8 - 8).toFixed(2)}deg`)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => { io.disconnect(); window.removeEventListener('scroll', onScroll); window.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf) }
  }, [])
  return null
}
