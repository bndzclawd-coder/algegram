/**
 * Timer challenges shown at /challenges (one per Reel).
 * To add one: append an entry. `releaseAt` is when the Reel posts (5 PM Pacific);
 * the challenge stays hidden on /challenges until then. Use an explicit UTC offset
 * (-07:00 while Pacific Daylight Time is in effect, -08:00 after the first Sunday of November).
 * `solvePath` must point to an existing seeded /solve page.
 */
export type Challenge = {
  equation: string
  answer: string
  releaseAt: string
  /** Shown to visitors, e.g. 'Sun Oct 18'. */
  dateLabel: string
  solvePath: string
}

export const CHALLENGES: Challenge[] = [
  // Posted Fri Oct 16 at 5 PM PT; listed on /challenges from Oct 17 (boosted Reel).
  { equation: 'x/3 + 4 = 10', answer: 'x = 18', releaseAt: '2026-10-17T14:50:00-07:00', dateLabel: 'Fri Oct 16', solvePath: '/solve/x-over-3-plus-4-equals-10' },
  { equation: '2x + 5 = 17', answer: 'x = 6', releaseAt: '2026-10-18T17:00:00-07:00', dateLabel: 'Sun Oct 18', solvePath: '/solve/2x-plus-5-equals-17' },
  { equation: '3(x − 2) = 15', answer: 'x = 7', releaseAt: '2026-10-20T17:00:00-07:00', dateLabel: 'Tue Oct 20', solvePath: '/solve/3-x-minus-2-equals-15' },
  { equation: 'x/4 − 3 = 2', answer: 'x = 20', releaseAt: '2026-10-22T17:00:00-07:00', dateLabel: 'Thu Oct 22', solvePath: '/solve/x-over-4-minus-3-equals-2' },
  { equation: '5x − 8 = 27', answer: 'x = 7', releaseAt: '2026-10-24T17:00:00-07:00', dateLabel: 'Sat Oct 24', solvePath: '/solve/5x-minus-8-equals-27' },
  { equation: '(x + 6)/2 = 9', answer: 'x = 12', releaseAt: '2026-10-26T17:00:00-07:00', dateLabel: 'Mon Oct 26', solvePath: '/solve/x-plus-6-over-2-equals-9' },
  { equation: '4x + 7 = 31', answer: 'x = 6', releaseAt: '2026-10-28T17:00:00-07:00', dateLabel: 'Wed Oct 28', solvePath: '/solve/4x-plus-7-equals-31' },
  { equation: '2(x + 3) = 14', answer: 'x = 4', releaseAt: '2026-10-30T17:00:00-07:00', dateLabel: 'Fri Oct 30', solvePath: '/solve/2-x-plus-3-equals-14' },
  { equation: '(x − 4)/3 = 5', answer: 'x = 19', releaseAt: '2026-10-29T17:00:00-07:00', dateLabel: 'Thu Oct 29', solvePath: '/solve/x-minus-4-over-3-equals-5' },
  // Still PDT (-07:00): US clocks change on Sun Nov 1, so later entries must use -08:00.
  { equation: '(x + 10)/4 = 6', answer: 'x = 14', releaseAt: '2026-10-31T17:00:00-07:00', dateLabel: 'Sat Oct 31', solvePath: '/solve/x-plus-10-over-4-equals-6' },
]

/** Released challenges, newest first. */
export function releasedChallenges(now: number = Date.now()): Challenge[] {
  return CHALLENGES
    .filter(c => Date.parse(c.releaseAt) <= now)
    .sort((a, b) => Date.parse(b.releaseAt) - Date.parse(a.releaseAt))
}

/** The next challenge still to come, if any. */
export function nextChallenge(now: number = Date.now()): Challenge | undefined {
  return CHALLENGES
    .filter(c => Date.parse(c.releaseAt) > now)
    .sort((a, b) => Date.parse(a.releaseAt) - Date.parse(b.releaseAt))[0]
}
