'use client'
import OfferText from '@/app/components/OfferText'
import { useEffect, useRef, useState } from 'react'
import { QUIZZES, type QuizQ } from '@/lib/quiz/data'
import { MathMarkdown } from '@/lib/chat/MathMarkdown'
import { useTrialEligible, proButtonText } from '@/lib/account/useTrialEligible'

type Acct = { signedIn: boolean; child: boolean; pro: boolean; center?: 'active' | 'ended' | null }

export default function QuizClient({ topic, questions }: { topic: string; questions: QuizQ[] }) {
  const [picked, setPicked] = useState<(number | null)[]>(questions.map(() => null))
  const [why, setWhy] = useState<Record<number, string>>({})
  const [busy, setBusy] = useState<number | null>(null)
  const [limit, setLimit] = useState(false)
  const [acct, setAcct] = useState<Acct>({ signedIn: false, child: false, pro: false })
  useEffect(() => {
    fetch('/api/usage', { cache: 'no-store' }).then(async r => {
      if (r.status === 401) return
      const d = await r.json().catch(() => null)
      setAcct({ signedIn: true, child: !!d?.child, pro: d?.plan === 'pro', center: d?.center ?? null })
    }).catch(() => {})
  }, [])
  // Carry the landing page's UTM tags to signup (first-touch cookie is also set by middleware on this visit).
  const [utm, setUtm] = useState('')
  useEffect(() => {
    const p = new URLSearchParams(window.location.search), out = new URLSearchParams()
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']) { const v = p.get(k); if (v && /^[\w.-]{1,64}$/.test(v)) out.set(k, v) }
    if (!out.has('utm_source')) { out.set('utm_source', 'quiz'); out.set('utm_medium', 'website'); out.set('utm_campaign', topic.replace(/-/g, '_')) }
    setUtm(out.toString())
  }, [topic])
  const others = Object.keys(QUIZZES).filter(k => k !== topic)
  // Score lives in page memory only. Nothing about the quiz is sent or saved.
  const trial = useTrialEligible(acct.signedIn && !acct.pro && !acct.child && !acct.center)
  const score = picked.filter((p, i) => p === questions[i].answer).length
  const done = picked.every(p => p !== null)
  // Signed-in only: save topic + score once when the quiz is finished. Guests: nothing is sent.
  const savedRef = useRef(false)
  useEffect(() => {
    if (!done || !acct.signedIn || savedRef.current) return
    savedRef.current = true
    fetch('/api/quiz/result', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, score }) }).catch(() => {})
  }, [done, acct.signedIn, topic, score])

  // "Ask Layla why" uses the normal chat endpoint, so each tap counts against the guest/free limit.
  async function askWhy(i: number) {
    const q = questions[i]
    setBusy(i)
    try {
      const content = `Quiz question: ${q.q}\nI chose: ${q.choices[picked[i]!]}\nThe correct answer is: ${q.choices[q.answer]}\nExplain simply why the correct answer is right and where my answer went wrong.`
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content }], mode: 'quiz', surface: 'home' }) })
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}))
        if (res.status === 429 || err.signup || err.limit || err.upgrade) { setLimit(true); return }
        setWhy(w => ({ ...w, [i]: `⚠️ ${err.error || 'Something went wrong.'}` })); return
      }
      const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = '', out = ''
      for (;;) {
        const { done, value } = await reader.read(); if (done) break
        buf += dec.decode(value, { stream: true }); const lines = buf.split('\n'); buf = lines.pop() || ''
        for (const l of lines) {
          if (!l.startsWith('data: ') || l.includes('[DONE]')) continue
          try { const d = JSON.parse(l.slice(6)).choices?.[0]?.delta?.content; if (d) { out += d; const o = out; setWhy(w => ({ ...w, [i]: o })) } } catch {}
        }
      }
    } catch { setWhy(w => ({ ...w, [i]: '⚠️ Something went wrong.' })) } finally { setBusy(null) }
  }

  const btn = { border: '1px solid var(--border)', borderRadius: 10, padding: '0.55rem 0.8rem', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', textAlign: 'left' as const, fontSize: '0.95rem' }
  return (
    <div>
      {questions.map((q, i) => {
        const p = picked[i]
        return (
          <section key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1rem 1.1rem', marginBottom: '1rem' }}>
            <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>{i + 1}. {q.q}</p>
            <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' }}>
              {q.choices.map((c, j) => {
                const chosen = p === j, right = p !== null && j === q.answer
                return <button key={j} disabled={p !== null} onClick={() => setPicked(a => a.map((x, k) => (k === i ? j : x)))}
                  style={{ ...btn, borderColor: right ? 'var(--green)' : chosen ? 'var(--red)' : 'var(--border)', opacity: p !== null && !chosen && !right ? 0.6 : 1 }}>{c}</button>
              })}
            </div>
            {p !== null && (p === q.answer
              ? <div style={{ color: 'var(--green)', marginTop: '0.6rem', fontSize: '0.9rem' }}>✓ Correct. <span style={{ color: 'var(--text)' }}><MathMarkdown text={q.why} /></span></div>
              : <div style={{ marginTop: '0.6rem' }}>
                  <p style={{ color: 'var(--red)', fontSize: '0.9rem' }}>Not quite. The answer is {q.choices[q.answer]}.</p>
                  <div data-testid='free-why' style={{ fontSize: '0.92rem', lineHeight: 1.7, marginTop: '0.4rem' }}><MathMarkdown text={q.why} /></div>
                  {why[i] ? <div style={{ color: 'var(--text)', fontSize: '0.92rem', lineHeight: 1.7, marginTop: '0.5rem', background: 'rgba(255,255,255,.03)', borderRadius: 10, padding: '0.6rem 0.8rem' }}><MathMarkdown text={why[i]} /></div>
                    : <button onClick={() => askWhy(i)} disabled={busy !== null} style={{ ...btn, marginTop: '0.5rem', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', border: 'none', fontWeight: 700 }}>{busy === i ? 'Layla is thinking…' : 'Ask Layla to explain more'}</button>}
                </div>)}
          </section>
        )
      })}
      {done && (
        <section data-testid='score-screen' style={{ background: 'linear-gradient(135deg,rgba(108,99,255,.18),rgba(139,92,246,.08))', border: '1px solid rgba(108,99,255,.45)', borderRadius: 18, padding: '1.5rem 1.25rem', textAlign: 'center', marginTop: '0.5rem' }}>
          <div style={{ fontSize: '2.2rem' }}>{score === questions.length ? '🏆' : score >= 3 ? '🎉' : '💪'}</div>
          <h2 style={{ fontWeight: 800, fontSize: '1.5rem', margin: '0.3rem 0' }}>You got {score}/{questions.length}!</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.92rem', marginBottom: '1.1rem' }}>
            {score === questions.length ? 'Perfect score. Nice work!' : score >= 3 ? 'Great effort. Check the explanations above for the ones you missed.' : 'Good try. Read the explanations above and give it another go.'}
          </p>
          {acct.center === 'ended'
            ? <p data-testid='center-ended' style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Your center&apos;s trial has ended. Ask your teacher.</p>
            : acct.signedIn && !acct.pro && !acct.child && !acct.center
            ? <a data-testid='try-pro' href='/upgrade' style={{ display: 'block', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.85rem', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>{proButtonText(trial)} →</a>
            : acct.signedIn
            ? <a href='/chat' style={{ display: 'block', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.85rem', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>Keep practicing with Layla →</a>
            : <>
                <a data-testid='pro-week' href={`/auth/signup${utm ? `?${utm}` : ''}`} style={{ display: 'block', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.85rem', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}><OfferText normal='Start your free Pro week →' center='Sign up free →' /></a>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}><OfferText normal='Sign up free, get 7 days of Pro. No card needed.' center='Sign up free with your center.' /></p>
              </>}
          <a href={`/quiz/${others[(others.length + Object.keys(QUIZZES).indexOf(topic)) % others.length]}${utm && !acct.signedIn ? `?${utm}` : ''}`} style={{ display: 'block', marginTop: '0.75rem', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.7rem', borderRadius: 12, fontWeight: 600, textDecoration: 'none' }}>Try another quiz →</a>
        </section>
      )}
      {limit && (
        <div role='dialog' style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setLimit(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 18, padding: '1.5rem', maxWidth: 380, width: '100%', textAlign: 'center', border: '1px solid rgba(108,99,255,.4)' }}>
            <p style={{ fontWeight: 700, marginBottom: '0.5rem' }}>You’ve used today’s free questions.</p>
            {!acct.signedIn ? <>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '1rem' }}><OfferText normal='Sign up free and get 7 days of Pro. No card needed.' center='Sign up free with your center to keep going.' /></p>
              <a href={`/auth/signup?utm_source=quiz&utm_campaign=${topic.replace(/-/g, '_')}`} style={{ display: 'block', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.75rem', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>Sign up free, get 7 days of Pro →</a>
            </> : acct.center ? <>
              <p data-testid='limit-center' style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{acct.center === 'ended' ? "Your center's trial has ended. Ask your teacher." : 'Come back tomorrow for more.'}</p>
            </> : acct.child ? <>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '1rem' }}>Ask a parent about Pro for more help today.</p>
              <a href='/chat?askparent=1' style={{ display: 'block', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.75rem', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>Ask a parent →</a>
            </> : <>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '1rem' }}>Pro gives you more help every day.{trial === false ? '' : ' Start with a 7-day free trial.'}</p>
              <a href='/upgrade' style={{ display: 'block', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.75rem', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>{proButtonText(trial)} →</a>
            </>}
            <button onClick={() => setLimit(false)} style={{ marginTop: '0.75rem', background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.8rem', cursor: 'pointer' }}>Not now</button>
          </div>
        </div>
      )}
    </div>
  )
}
