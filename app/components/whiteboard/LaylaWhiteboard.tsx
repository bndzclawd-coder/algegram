'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import katex from 'katex'
import MathText from '@/app/components/MathText'
import { parseSteps, speakable, type WbStep } from '@/lib/whiteboard/parse'

// Layla browser whiteboard. Voice = the browser's own Web Speech API (on-device / OS voices);
// nothing is sent to any voice service by Algegram. Captions are always on. No analytics.
const OPENER = "Hi, I'm Layla, your AI tutor."
const NOTE_KEY = 'layla-voice-note-v1'
const NOTE = "Layla's voice comes from your device, so it may sound different on each one. Captions are always on."

const PREFERRED = /(samantha|ava|allison|susan|zira|aria|jenny|michelle|emma|google us english|female)/i
export function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const us = voices.filter(v => /^en[-_]US/i.test(v.lang))
  return us.find(v => PREFERRED.test(v.name) && !/\bmale\b/i.test(v.name)) ?? us.find(v => !/\bmale\b/i.test(v.name)) ?? us[0] ?? voices.find(v => /^en/i.test(v.lang)) ?? null
}

function Board({ step, reduce }: { step: WbStep; reduce: boolean }) {
  return (
    <div className='wb-board' aria-live='off'>
      {step.math.map((m, i) => (
        <div key={i} className={reduce ? 'wb-eq' : 'wb-eq wb-write'} style={{ animationDelay: `${i * 0.6}s` }}
          dangerouslySetInnerHTML={{ __html: katex.renderToString(m, { displayMode: true, throwOnError: false, strict: 'ignore' }) }} />
      ))}
      {step.math.length === 0 && <div className={reduce ? 'wb-eq' : 'wb-eq wb-write'}><MathText text={step.caption} /></div>}
    </div>
  )
}

export default function LaylaWhiteboard({ answer, onClose }: { answer: string; onClose: () => void }) {
  const steps = useMemo(() => parseSteps(answer), [answer])
  const all: WbStep[] = useMemo(() => [{ caption: OPENER, math: [] }, ...steps], [steps])
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [note, setNote] = useState(false)
  const [reduce, setReduce] = useState(false)
  const [hasSpeech, setHasSpeech] = useState(false)
  const dialog = useRef<HTMLDivElement>(null)
  const lastFocus = useRef<Element | null>(null)
  const voice = useRef<SpeechSynthesisVoice | null>(null)

  useEffect(() => {
    lastFocus.current = document.activeElement
    setReduce(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    try { if (!localStorage.getItem(NOTE_KEY)) { setNote(true); localStorage.setItem(NOTE_KEY, '1') } } catch {}
    const ok = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'
    setHasSpeech(ok)
    if (ok) {
      const load = () => { voice.current = pickVoice(window.speechSynthesis.getVoices()) }
      load(); window.speechSynthesis.addEventListener?.('voiceschanged', load)
    }
    dialog.current?.focus()
    return () => {
      try { window.speechSynthesis?.cancel() } catch {}
      ;(lastFocus.current as HTMLElement | null)?.focus?.()
    }
  }, [])

  const next = useCallback(() => setI(n => Math.min(n + 1, all.length - 1)), [all.length])

  // Narrate the current step; advance when speech ends (or after a reading-time timer without speech).
  useEffect(() => {
    if (!playing) { try { window.speechSynthesis?.cancel() } catch {}; return }
    const step = all[i]
    const text = speakable([step.caption, ...step.math].join('. '))
    let done = false
    const advance = () => { if (done) return; done = true; if (i < all.length - 1) next(); else setPlaying(false) }
    let timer: ReturnType<typeof setTimeout> | undefined
    if (hasSpeech) {
      try {
        window.speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(text)
        if (voice.current) u.voice = voice.current
        u.lang = voice.current?.lang ?? 'en-US'; u.rate = 0.95; u.pitch = 1.05
        u.onend = () => { timer = setTimeout(advance, 600) }
        u.onerror = () => { timer = setTimeout(advance, Math.max(2500, text.length * 60)) }
        window.speechSynthesis.speak(u)
      } catch { timer = setTimeout(advance, Math.max(2500, text.length * 60)) }
    } else {
      timer = setTimeout(advance, Math.max(2500, text.length * 60)) // captions-only fallback
    }
    return () => { done = true; if (timer) clearTimeout(timer) }
  }, [i, playing, hasSpeech, all, next])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose() }
    else if (e.key === 'ArrowRight') { e.preventDefault(); next() }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); setI(n => Math.max(0, n - 1)) }
    else if (e.key === ' ' && (e.target as HTMLElement).tagName !== 'BUTTON') { e.preventDefault(); setPlaying(p => !p) }
    else if (e.key === 'Tab') { // focus trap
      const f = dialog.current?.querySelectorAll<HTMLElement>('button')
      if (!f || f.length === 0) return
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
  }

  const step = all[i]
  return (
    <div className='wb-backdrop' onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={dialog} className='wb-modal' role='dialog' aria-modal='true' aria-labelledby='wb-title' tabIndex={-1} onKeyDown={onKey}>
        <div className='wb-top'>
          <span id='wb-title' className='wb-name'>Layla · whiteboard lesson</span>
          <span className='wb-badge' role='note'>🤖 Layla is an AI tutor, not a real person</span>
          <button className='wb-x' onClick={onClose} aria-label='Close lesson'>✕</button>
        </div>
        {note && <p className='wb-note' role='status'>{NOTE}</p>}
        {!hasSpeech && <p className='wb-note' role='status'>Voice isn&apos;t available in this browser, so Layla will use captions only.</p>}
        <div key={i} className={reduce ? 'wb-stage' : 'wb-stage wb-in'}>
          {i === 0 ? <div className='wb-hello'>👋</div> : <Board step={step} reduce={reduce} />}
        </div>
        <div className='wb-caption' aria-live='polite'><MathText text={step.caption} /></div>
        <div className='wb-controls'>
          <button onClick={() => setI(n => Math.max(0, n - 1))} disabled={i === 0} aria-label='Previous step'>◀</button>
          <button onClick={() => setPlaying(p => !p)} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '❚❚ Pause' : '▶ Play'}</button>
          <button onClick={next} disabled={i === all.length - 1} aria-label='Next step'>▶</button>
          <span className='wb-count'>{i === 0 ? 'Intro' : `Step ${i} of ${all.length - 1}`}</span>
        </div>
      </div>
      <style>{CSS}</style>
    </div>
  )
}

const CSS = `
.wb-backdrop{position:fixed;inset:0;z-index:300;background:rgba(5,4,12,.82);display:flex;align-items:center;justify-content:center;padding:12px}
.wb-modal{width:min(820px,100%);max-height:96vh;overflow:auto;background:#0f0f13;border:1px solid rgba(167,139,250,.35);border-radius:22px;padding:16px;color:#e8e8f0;box-shadow:0 30px 120px -20px rgba(108,99,255,.55);outline:none}
.wb-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.wb-name{font-weight:800;color:#a78bfa}
.wb-badge{font-size:.78rem;font-weight:700;background:rgba(108,99,255,.22);border:1px solid rgba(108,99,255,.5);border-radius:999px;padding:3px 10px}
.wb-x{margin-left:auto;background:none;border:1px solid #2a2a38;color:#e8e8f0;border-radius:10px;width:36px;height:36px;cursor:pointer}
.wb-note{font-size:.82rem;color:#c9c3e6;background:rgba(255,255,255,.04);border:1px solid #2a2a38;border-radius:10px;padding:8px 10px;margin:10px 0 0}
.wb-stage{margin-top:12px;min-height:240px;border-radius:16px;background:radial-gradient(120% 90% at 50% 0%,#1c1a33,#0f0f13);border:1px solid #2a2a38;display:flex;align-items:center;justify-content:center;padding:18px}
.wb-in{animation:wbin .45s cubic-bezier(.2,.7,.2,1)}
@keyframes wbin{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.wb-board{width:100%;display:grid;gap:12px;font-size:clamp(1.3rem,4vw,1.9rem)}
.wb-eq{color:#fff;text-align:center;overflow-x:auto}
.wb-write{animation:wbwrite 1.4s steps(22,end) both}
@keyframes wbwrite{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
.wb-hello{font-size:4rem}
.wb-caption{margin-top:12px;min-height:3.2em;font-size:1.05rem;line-height:1.6;background:rgba(0,0,0,.35);border-radius:12px;padding:10px 12px}
.wb-controls{display:flex;gap:8px;align-items:center;margin-top:12px;flex-wrap:wrap}
.wb-controls button{background:rgba(255,255,255,.06);border:1px solid #2a2a38;color:#e8e8f0;border-radius:10px;padding:8px 14px;font-weight:700;cursor:pointer}
.wb-controls button:disabled{opacity:.4;cursor:default}
.wb-controls button:focus-visible,.wb-x:focus-visible{outline:2px solid #a78bfa;outline-offset:2px}
.wb-count{margin-left:auto;font-size:.82rem;color:#9a9ab0}
@media(prefers-reduced-motion:reduce){.wb-in,.wb-write{animation:none!important}}
`
