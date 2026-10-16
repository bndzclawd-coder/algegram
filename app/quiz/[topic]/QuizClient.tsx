'use client'
import { useEffect, useState } from 'react'
import type { QuizQ } from '@/lib/quiz/data'
import { renderTextWithLinks } from '@/lib/chat/links'

type Acct = { signedIn: boolean; child: boolean; pro: boolean }

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
      setAcct({ signedIn: true, child: !!d?.child, pro: d?.plan === 'pro' })
    }).catch(() => {})
  }, [])
  const score = picked.filter((p, i) => p === questions[i].answer).length
  const done = picked.every(p => p !== null)

  // "Ask Layla why" uses the normal chat endpoint, so each tap counts against the guest/free limit.
  async function askWhy(i: number) {
    const q = questions[i]
    setBusy(i)
    try {
      const content = `Quiz question: ${q.q}\nI chose: ${q.choices[picked[i]!]}\nThe correct answer is: ${q.choices[q.answer]}\nExplain briefly, step by step, why my answer is wrong and the correct one is right.`
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content }], mode: 'explain', surface: 'home' }) })
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
              ? <p style={{ color: 'var(--green)', marginTop: '0.6rem', fontSize: '0.9rem' }}>✓ Correct. {q.why}</p>
              : <div style={{ marginTop: '0.6rem' }}>
                  <p style={{ color: 'var(--red)', fontSize: '0.9rem' }}>Not quite. The answer is {q.choices[q.answer]}.</p>
                  {why[i] ? <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '0.4rem' }}>{renderTextWithLinks(why[i])}</p>
                    : <button onClick={() => askWhy(i)} disabled={busy !== null} style={{ ...btn, marginTop: '0.5rem', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', border: 'none', fontWeight: 700 }}>{busy === i ? 'Layla is thinking…' : 'Ask Layla why'}</button>}
                </div>)}
          </section>
        )
      })}
      {done && <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>Score: {score}/{questions.length}</p>}
      {limit && (
        <div role='dialog' style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setLimit(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 18, padding: '1.5rem', maxWidth: 380, width: '100%', textAlign: 'center', border: '1px solid rgba(108,99,255,.4)' }}>
            <p style={{ fontWeight: 700, marginBottom: '0.5rem' }}>You’ve used today’s free questions.</p>
            {!acct.signedIn ? <>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '1rem' }}>Sign up free and get 7 days of Pro. No card needed.</p>
              <a href={`/auth/signup?utm_source=quiz&utm_campaign=${topic.replace(/-/g, '_')}`} style={{ display: 'block', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.75rem', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>Sign up free, get 7 days of Pro →</a>
            </> : acct.child ? <>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '1rem' }}>Ask a parent about Pro for more help today.</p>
              <a href='/chat?askparent=1' style={{ display: 'block', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.75rem', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>Ask a parent →</a>
            </> : <>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '1rem' }}>Pro gives you more help every day. Start with a 7-day free trial.</p>
              <a href='/upgrade' style={{ display: 'block', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.75rem', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>Try Pro free for 7 days →</a>
            </>}
            <button onClick={() => setLimit(false)} style={{ marginTop: '0.75rem', background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.8rem', cursor: 'pointer' }}>Not now</button>
          </div>
        </div>
      )}
    </div>
  )
}
