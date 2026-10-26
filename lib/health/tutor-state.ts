// Pure alert logic for the hourly tutor health check (no I/O, unit-tested in scripts/tutor-health.test.ts).
export type HealthState = { consecutive_failures: number; alerted: boolean }
export type HealthAction = 'none' | 'alert' | 'recovery'
export const ALERT_AFTER = 2

/** Next state + which email (if any) to send. One alert per outage, one recovery when it passes again. */
export function nextHealthState(prev: HealthState, ok: boolean): { state: HealthState; action: HealthAction } {
  if (ok) return { state: { consecutive_failures: 0, alerted: false }, action: prev.alerted ? 'recovery' : 'none' }
  const n = prev.consecutive_failures + 1
  if (!prev.alerted && n >= ALERT_AFTER) return { state: { consecutive_failures: n, alerted: true }, action: 'alert' }
  return { state: { consecutive_failures: n, alerted: prev.alerted }, action: 'none' }
}

/** "9:48 AM PT, Mon Oct 26, 2026" */
export function ptTime(d: Date): string {
  const t = d.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit' })
  const day = d.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  return `${t} PT, ${day}`
}
