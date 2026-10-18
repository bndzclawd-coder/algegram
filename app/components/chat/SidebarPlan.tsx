'use client'
import Link from 'next/link'
import { proButtonText } from '@/lib/account/useTrialEligible'
import { canShowUpsell, type Usage } from '@/lib/account/upsell'

type Props = {
  usage: Usage | null
  user: { email?: string | null } | null
  authResolved: boolean
  trial: boolean | null
  askState: 'idle' | 'sending' | 'sent' | 'error'
  askError: string
  askParent: () => void
  upgradeToPro: () => void
  signOut: () => void
}

/**
 * Sidebar plan box in /chat. Child-privacy rule: no upgrade, trial or pricing CTA ever renders for an
 * under-13 account, including during free Pro and while the account is still loading (canShowUpsell).
 * Kids get only "Ask a parent about Pro", which notifies the approved parent.
 */
export default function SidebarPlan({ usage, user, authResolved, trial, askState, askError, askParent, upgradeToPro, signOut }: Props) {
  const isPro = usage?.plan === 'pro'
  const usagePercent = usage?.limit ? Math.min(100, ((usage.used / usage.limit) * 100)) : 0
  return (
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
          {isPro ? (
            <div style={{ background: 'rgba(108,99,255,.1)', border: '1px solid rgba(108,99,255,.25)', borderRadius: '10px', padding: '0.75rem', textAlign: 'center', marginBottom: '0.75rem' }}>
              <div data-testid='plan-label' style={{ fontSize: '0.75rem', color: 'var(--accent2)', fontWeight: 600 }}>
                {usage?.center === 'active' && usage?.centerName
                  ? `⭐ Pro through ${usage.centerName}${usage.compProUntil && !usage.paid ? `, until ${new Date(usage.compProUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' })}` : ''}`
                  : usage?.bonus && !usage?.paid && usage?.bonusProUntil
                  ? (() => { const n = Math.max(1, Math.ceil((new Date(usage.bonusProUntil!).getTime() - Date.now()) / 86400000)); return `⭐ Free Pro: ${n} day${n === 1 ? '' : 's'} left` })()
                  : '⭐ Pro'}
              </div>
              {usage?.bonus && !usage?.paid && canShowUpsell(usage) && (
                <a data-testid='sidebar-pro-cta' href='/upgrade' style={{ display: 'block', marginTop: '0.6rem', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', borderRadius: 8, padding: '0.55rem', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>
                  {trial === false ? 'Get Pro for $12.99/mo' : 'Keep Pro after your free week'} →
                </a>
              )}
            </div>
          ) : null}
          {!isPro && usage?.centerFull && (
            <div data-testid='center-full' style={{ background: 'rgba(251,191,36,.1)', border: '1px solid rgba(251,191,36,.35)', borderRadius: '10px', padding: '0.6rem', textAlign: 'center', marginBottom: '0.75rem', fontSize: '0.75rem' }}>Your center&apos;s seats are full. Ask your teacher.</div>
          )}
          {isPro ? null : usage?.center === 'ended' ? (
            <div data-testid='center-ended' style={{ background: 'rgba(255,255,255,.04)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.75rem', textAlign: 'center', marginBottom: '0.75rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>Your center&apos;s trial has ended. Ask your teacher.</div>
          ) : usage?.bonusEnded && !usage?.child ? (
            <div style={{ background: 'rgba(108,99,255,.1)', border: '1px solid rgba(108,99,255,.25)', borderRadius: '10px', padding: '0.75rem', textAlign: 'center', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Your free Pro days have ended. You&apos;re on Free, nothing was charged.</div>
            </div>
          ) : null}
          {isPro ? (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Link href='/practice' style={{ flex: 1, textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, padding: '0.45rem', borderRadius: 8, border: '1px solid var(--border)', color: 'var(--text)' }}>📝 Practice</Link>
              <Link href='/test' style={{ flex: 1, textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, padding: '0.45rem', borderRadius: 8, border: '1px solid var(--border)', color: 'var(--text)' }}>⏱ Tests</Link>
            </div>
          ) : !authResolved ? null : (
            <div style={{ marginBottom: '0.75rem' }}>
              {user && <div data-testid='plan-label' style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem' }}>Free</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
                <span>Daily messages</span>
                <span>{usage?.used ?? 0}/{usage?.limit ?? 20}</span>
              </div>
              <div style={{ height: 4, background: 'var(--border)', borderRadius: 99 }}>
                <div style={{ height: '100%', width: `${usagePercent}%`, background: usagePercent > 80 ? 'var(--red)' : 'var(--accent)', borderRadius: 99, transition: 'width .3s' }} />
              </div>
              {user && usage?.child === true ? (
                askState === 'sent' ? (
                  <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--green)', textAlign: 'center' }}>✅ We let your grown-up know! They'll get an email about Pro.</p>
                ) : (
                  <>
                    <button onClick={askParent} disabled={askState === 'sending'}
                      style={{ marginTop: '0.75rem', width: '100%', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.6rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                      {askState === 'sending' ? 'Sending…' : 'Ask a parent about Pro'}
                    </button>
                    {askState === 'error' && <p style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: 'var(--red)' }}>{askError}</p>}
                  </>
                )
              ) : user && canShowUpsell(usage) && (
                <button data-testid='sidebar-pro-cta' onClick={upgradeToPro}
                  style={{ marginTop: '0.75rem', width: '100%', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.6rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                  {proButtonText(trial)} →
                </button>
              )}
            </div>
          )}
          {user ? (
            <>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              <button onClick={signOut} style={{ marginTop: '0.4rem', background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}>Sign out</button>
            </>
          ) : !authResolved ? null : (
            <a href="/auth/signup" style={{ display: 'block', textAlign: 'center', background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color: '#fff', padding: '0.55rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none' }}>
              Sign up free →
            </a>
          )}
        </div>
  )
}
