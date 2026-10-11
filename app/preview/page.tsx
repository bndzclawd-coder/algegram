import type { Metadata } from 'next'
import HomepageChat from '@/app/components/HomepageChat'
import { GUEST_FREE_QUESTIONS, FREE_DAILY_QUESTIONS, PRO_CTA_TEXT } from '@/lib/site-config'
import { PROTO_CSS, PROTO_NAV, PROTO_REST } from './proto'

// UAT-only homepage prototype. Not linked, not in the sitemap, noindex (meta + X-Robots-Tag header).
// The Ask Layla box is the live guest chat (/api/chat): same server-side 5-question limit,
// nothing stored, no analytics, question text never logged.
export const metadata: Metadata = {
  title: { absolute: 'Algegram homepage prototype (preview)' },
  robots: { index: false, follow: false },
}

const fill = (s: string) =>
  s.replaceAll('__GUEST__', String(GUEST_FREE_QUESTIONS))
   .replaceAll('__FREE__', String(FREE_DAILY_QUESTIONS))
   .replaceAll('__CTA__', PRO_CTA_TEXT)

const ASK_CSS = `.ask-live{--surface:#fff;--text:#1d1b3a;--text-dim:#5d5a7a;--border:#e4def5;--accent:#6c4cf5;--accent2:#6c4cf5;color:#1d1b3a;margin:14px 0}
.ask-live .hero-section{padding:0!important;max-width:none!important}
.ai-note{display:inline-block;background:#ece7ff;color:#1d1b3a;border-radius:999px;padding:4px 12px;font-size:.8rem;font-weight:700;margin-bottom:8px}`

export default function PreviewPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PROTO_CSS + ASK_CSS }} />
      <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: PROTO_NAV }} />
      <div className='wrap'>
        <header className='hero'>
          <div>
            <span className='badge'>✦ AI tutor</span>
            <h1>Meet <em>Layla</em>, your AI math tutor</h1>
            <p className='sub'>Type any problem. Watch her explain it, step by step.</p>
            <div className='ask-live'>
              <span className='ai-note' role='note'>🤖 Layla is an AI tutor, not a real person</span>
              <HomepageChat intro="Hi, I'm Layla, an AI tutor." />
            </div>
            <div className='cta'><a className='btn alt' href='/auth/signup'>Sign up free for {FREE_DAILY_QUESTIONS} questions a day</a><span className='small'>Arithmetic to university calculus.</span></div>
          </div>
          <div className='phone'>
            <video src='/preview/layla-2x5-voice.mp4' poster='/preview/hero-poster.png' controls playsInline preload='metadata' />
            <span className='badge'>AI tutor · voiced by AI</span>
          </div>
        </header>
      </div>
      <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: fill(PROTO_REST) }} />
    </>
  )
}
