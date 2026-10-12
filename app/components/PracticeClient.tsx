'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import MathText from '@/app/components/MathText'
import WatchLaylaButton from '@/app/components/whiteboard/WatchLaylaButton'
import { PRACTICE_TOPICS, DIFFICULTIES, type TopicId, type Difficulty } from '@/lib/practice/topics'

type Mode = 'practice' | 'test'
type Review = { correct: boolean; answer: string; steps: string[]; hint: string | null }
type Spot = { topic: TopicId; label: string; pct: number; total: number }
type ErrBody = { error?: string; upgrade?: boolean; signin?: boolean; ageRequired?: boolean; href?: string; limit?: boolean }

const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.25rem' } as const
const btn = { background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, padding: '0.65rem 1.3rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' } as const
const ghost = { background: 'rgba(255,255,255,.05)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.6rem 1.1rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' } as const
const input = { width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', padding: '0.6rem 0.75rem', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' } as const

function ErrorBox({ err }: { err: ErrBody }) {
  return (
    <div role='alert' style={{ ...card, borderColor: 'rgba(248,113,113,.4)', marginTop: '1rem' }}>
      <p style={{ margin: 0 }}>{err.error}</p>
      {err.upgrade && <a href='/upgrade' rel='nofollow' style={{ color: 'var(--accent2)', fontWeight: 700 }}>Try Pro →</a>}
      {err.signin && <Link href='/auth/login' style={{ color: 'var(--accent2)', fontWeight: 700 }}>Sign in →</Link>}
      {err.href && <Link href={err.href} style={{ color: 'var(--accent2)', fontWeight: 700 }}>Continue →</Link>}
    </div>
  )
}

function Solution({ r }: { r: Review }) {
  return (
    <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', lineHeight: 1.7 }}>
      <div style={{ fontWeight: 700, color: r.correct ? 'var(--green)' : 'var(--red)' }}>{r.correct ? '✓ Correct' : '✗ Not quite'}</div>
      {!r.correct && r.hint && <div style={{ color: 'var(--text-dim)' }}>Hint: <MathText text={r.hint} /></div>}
      <div style={{ marginTop: '0.4rem' }}>Answer: <strong>{r.answer}</strong></div>
      <ol style={{ margin: '0.4rem 0 0', paddingLeft: '1.2rem', color: 'var(--text-dim)' }}>
        {r.steps.map((s, i) => <li key={i}><MathText text={s} /></li>)}
      </ol>
      {r.steps.length > 0 && <WatchLaylaButton answer={[...r.steps.map((s, i) => `Step ${i + 1}: ${s}`), `Step ${r.steps.length + 1}: Answer: ${r.answer}`].join('\n\n')} />}
    </div>
  )
}

export default function PracticeClient({ mode }: { mode: Mode }) {
  const [topic, setTopic] = useState<TopicId>('linear-equations')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<ErrBody | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [questions, setQuestions] = useState<string[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const [checked, setChecked] = useState<(Review | null)[]>([])
  const [result, setResult] = useState<{ score: number; total: number; review: Review[] } | null>(null)
  const [left, setLeft] = useState<number | null>(null)
  const finishing = useRef(false)
  const [spots, setSpots] = useState<Spot[]>([])

  // Weak spots: lowest-scoring topics from your saved topic scores (no questions are stored).
  useEffect(() => {
    fetch('/api/practice/weak-spots', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null))
      .then(d => { if (Array.isArray(d?.spots)) setSpots(d.spots) }).catch(() => {})
  }, [result])

  async function post(url: string, body: unknown) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json().catch(() => ({ error: 'Something went wrong.' }))
    return { ok: res.ok, data }
  }

  async function start(t: TopicId = topic) {
    setTopic(t)
    setLoading(true); setErr(null); setResult(null); finishing.current = false
    const { ok, data } = await post('/api/practice/generate', { mode, topic: t, difficulty })
    setLoading(false)
    if (!ok) { setErr(data); return }
    setToken(data.token); setQuestions(data.questions)
    setAnswers(data.questions.map(() => '')); setChecked(data.questions.map(() => null))
    setLeft(data.seconds ?? null)
  }

  async function check(i: number) {
    if (!token || !answers[i].trim()) return
    const { ok, data } = await post('/api/practice/check', { token, index: i, answer: answers[i] })
    if (!ok) { setErr(data); return }
    setChecked(c => { const n = [...c]; n[i] = data; return n })
  }

  async function finish() {
    if (!token || finishing.current) return
    finishing.current = true
    const { ok, data } = await post('/api/practice/finish', { token, answers })
    if (!ok) { setErr(data); finishing.current = false; return }
    setResult(data); setLeft(null)
  }

  useEffect(() => {
    if (left === null || result) return
    if (left <= 0) { finish(); return }
    const t = setTimeout(() => setLeft(l => (l === null ? l : l - 1)), 1000)
    return () => clearTimeout(t)
  }) // eslint-disable-line react-hooks/exhaustive-deps

  const inSet = token && questions.length > 0 && !result
  const title = mode === 'test' ? 'Quiz & test' : 'Practice'

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '2rem 1rem 4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>{title} <span style={{ fontSize: '0.75rem', verticalAlign: 'middle', background: 'rgba(108,99,255,.15)', border: '1px solid rgba(108,99,255,.3)', color: 'var(--accent2)', padding: '0.2rem 0.6rem', borderRadius: 999 }}>Pro</span></h1>
        <nav style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem' }}>
          <Link href='/chat' style={{ color: 'var(--text-dim)' }}>Chat</Link>
          <Link href='/practice' style={{ color: mode === 'practice' ? 'var(--text)' : 'var(--text-dim)' }}>Practice</Link>
          <Link href='/test' style={{ color: mode === 'test' ? 'var(--text)' : 'var(--text-dim)' }}>Tests</Link>
        </nav>
      </div>
      <p style={{ color: 'var(--text-dim)', marginTop: '0.5rem' }}>
        {mode === 'test' ? '10 questions, 15 minutes. You get your score and a full review at the end.' : '5 questions. Check each answer to see the steps, with a hint when you miss.'}
        {' '}Questions are written by AI, so they can occasionally be wrong.
      </p>

      {!inSet && spots.length > 0 && (
        <div style={{ ...card, marginTop: '1.25rem' }}>
          <div style={{ fontWeight: 700 }}>Your weak spots</div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', margin: '0.25rem 0 0.75rem' }}>Built from your scores in the last 30 days. Tap one to practice it.</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {spots.map(sp => (
              <button key={sp.topic} type='button' style={ghost} disabled={loading} onClick={() => start(sp.topic)}>
                {sp.label} · {sp.pct}%
              </button>
            ))}
          </div>
        </div>
      )}

      {!inSet && (
        <div style={{ ...card, marginTop: '1.25rem', display: 'grid', gap: '0.9rem' }}>
          <label>Topic
            <select value={topic} onChange={e => setTopic(e.target.value as TopicId)} style={{ ...input, marginTop: 6 }}>
              {PRACTICE_TOPICS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </label>
          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend style={{ marginBottom: 6 }}>Difficulty</legend>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {DIFFICULTIES.map(d => (
                <button key={d} type='button' aria-pressed={difficulty === d} onClick={() => setDifficulty(d)}
                  style={{ ...ghost, textTransform: 'capitalize', borderColor: difficulty === d ? 'var(--accent)' : 'var(--border)' }}>{d}</button>
              ))}
            </div>
          </fieldset>
          <div><button style={btn} onClick={() => start()} disabled={loading}>{loading ? 'Writing your questions…' : mode === 'test' ? 'Start test' : 'Start practice'}</button></div>
        </div>
      )}

      {err && <ErrorBox err={err} />}

      {inSet && (
        <div style={{ marginTop: '1.25rem', display: 'grid', gap: '1rem' }}>
          {left !== null && (
            <div aria-live='polite' style={{ position: 'sticky', top: 8, zIndex: 5, alignSelf: 'start', ...card, padding: '0.5rem 1rem', fontWeight: 700, color: left < 60 ? 'var(--red)' : 'var(--text)' }}>
              ⏱ {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')} left
            </div>
          )}
          {questions.map((q, i) => (
            <div key={i} style={card}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 6 }}>Question {i + 1} of {questions.length}</div>
              <div style={{ fontSize: '1rem', lineHeight: 1.7 }}><MathText text={q} /></div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <input aria-label={`Answer ${i + 1}`} value={answers[i]} disabled={!!checked[i]}
                  onChange={e => setAnswers(a => { const n = [...a]; n[i] = e.target.value; return n })}
                  onKeyDown={e => { if (e.key === 'Enter' && mode === 'practice') check(i) }}
                  placeholder='Your answer, e.g. 6, -3/4, 2x+1' style={input} />
                {mode === 'practice' && <button style={ghost} onClick={() => check(i)} disabled={!!checked[i] || !answers[i].trim()}>Check</button>}
              </div>
              {checked[i] && <Solution r={checked[i]!} />}
            </div>
          ))}
          <div><button style={btn} onClick={finish}>{mode === 'test' ? 'Submit test' : 'Finish and save score'}</button></div>
        </div>
      )}

      {result && (
        <div style={{ marginTop: '1.25rem', display: 'grid', gap: '1rem' }}>
          <div style={{ ...card, textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Your score</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{result.score} / {result.total}</div>
            <button style={{ ...btn, marginTop: '0.5rem' }} onClick={() => { setToken(null); setQuestions([]); setResult(null) }}>New {mode === 'test' ? 'test' : 'set'}</button>
          </div>
          {result.review.map((r, i) => (
            <div key={i} style={card}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 6 }}>Question {i + 1}</div>
              <MathText text={questions[i]} />
              <div style={{ fontSize: '0.85rem', marginTop: 6, color: 'var(--text-dim)' }}>Your answer: {answers[i] || '—'}</div>
              <Solution r={r} />
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
