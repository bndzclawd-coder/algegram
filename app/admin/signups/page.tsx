import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getSessionUser, loadRawSignups } from '@/lib/admin/server'
import { adminGate, buildRows, loginUrlFor, summarize, type SignupRow } from '@/lib/admin/signups'
import RevealButton from './RevealButton'

// Owner-only. Everyone else gets a 404 (also enforced in middleware). Never cached or indexed.
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const metadata: Metadata = {
  title: 'Signups · Admin',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
}

const FLAG_STYLE: Record<string, string> = {
  real: 'bg-emerald-100 text-emerald-800',
  test: 'bg-amber-100 text-amber-800',
  owner: 'bg-slate-200 text-slate-700',
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))])
}

export default async function AdminSignupsPage({ searchParams }: { searchParams: { all?: string } }) {
  const includeTests = searchParams?.all === '1'
  // Same gate as middleware (defense in depth): signed out -> sign-in, not the owner -> 404.
  const gate = adminGate('/admin/signups', includeTests ? '?all=1' : '', await getSessionUser())
  if (gate.action === 'login') redirect(loginUrlFor(gate.next))
  if (gate.action !== 'allow') notFound()

  let rows: SignupRow[]
  try {
    rows = buildRows(await withTimeout(loadRawSignups(), 15000))
  } catch {
    console.error('[admin] signups load failed')
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 text-slate-900">
        <h1 className="text-2xl font-bold">Signups</h1>
        <p className="mt-3">The signup list couldn’t load right now. <a className="text-indigo-600 underline" href="/admin/signups">Try again</a>.</p>
      </main>
    )
  }
  const s = summarize(rows, includeTests)
  const shown = includeTests ? rows : rows.filter(r => r.flag === 'real')

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 text-slate-900">
      <h1 className="text-2xl font-bold">Signups</h1>
      <p className="mt-1 text-sm text-slate-500">Private owner view. Times are Pacific. Emails stay hidden until you tap Show; for kids under 13 only the parent’s email is shown.</p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[['This week (since Mon)', s.week], ['Month to date', s.month], ['All time', s.all]].map(([label, n]) => (
          <div key={label as string} className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">{label} · {includeTests ? 'all accounts' : 'real'}</div>
            <div className="mt-1 text-3xl font-bold">{n}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-sm">
        {includeTests
          ? <Link className="text-indigo-600 underline" href="/admin/signups">Hide test and owner accounts</Link>
          : <span>{s.hidden} test/owner account{s.hidden === 1 ? '' : 's'} hidden. <Link className="text-indigo-600 underline" href="/admin/signups?all=1">Include them</Link></span>}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="px-3 py-2">Created (PT)</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">How they found us</th><th className="px-3 py-2">Flag</th><th className="px-3 py-2">Plan</th><th className="px-3 py-2">Email</th></tr>
          </thead>
          <tbody>
            {shown.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-500">No {includeTests ? '' : 'real '}signups yet.</td></tr>}
            {shown.map(r => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="whitespace-nowrap px-3 py-2">{r.createdPt}</td>
                <td className="px-3 py-2">{r.type}</td>
                <td className="px-3 py-2">{r.source}</td>
                <td className="px-3 py-2"><span className={`rounded px-2 py-0.5 text-xs ${FLAG_STYLE[r.flag]}`} title={r.flagReason ?? ''}>{r.flag}{r.flagReason ? ` · ${r.flagReason}` : ''}</span></td>
                <td className="px-3 py-2">{r.plan}</td>
                <td className="px-3 py-2"><RevealButton id={r.id} kid={r.type === 'kid'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
