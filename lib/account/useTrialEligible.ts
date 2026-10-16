'use client'
import { useEffect, useState } from 'react'

export const TRIAL_BUTTON = 'Try Pro free for 7 days'
export const NO_TRIAL_BUTTON = 'Get Pro for $12.99/mo'

/** true = 7-day trial, false = had a Stripe subscription before (no trial), null = unknown/loading. */
export function useTrialEligible(enabled = true): boolean | null {
  const [v, setV] = useState<boolean | null>(null)
  useEffect(() => {
    if (!enabled) return
    fetch('/api/account/trial-eligibility', { cache: 'no-store' }).then(r => r.json()).then(d => setV(typeof d?.eligible === 'boolean' ? d.eligible : null)).catch(() => {})
  }, [enabled])
  return v
}
export function proButtonText(eligible: boolean | null): string {
  return eligible === false ? NO_TRIAL_BUTTON : eligible === true ? TRIAL_BUTTON : 'Get Pro'
}
