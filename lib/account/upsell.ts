// Child-privacy rule for every upgrade, trial or pricing CTA in the app (sidebar, chat, camera modal,
// whiteboard, practice, settings). Under-13 accounts never see one: their upgrades go only through the
// "Ask a parent about Pro" note to the approved parent. Unknown age (still loading, or the account
// request failed) counts as "maybe a child", so CTAs stay hidden until /api/usage says child === false.
export type Usage = {
  child?: boolean; plan: string; used: number; limit: number | null; remaining: number | null; paid?: boolean
  bonus?: boolean; bonusProUntil?: string | null; bonusEnded?: boolean; center?: 'active' | 'ended' | null
  centerName?: string | null; centerFull?: boolean; compProUntil?: string | null
}

export function canShowUpsell(u: Pick<Usage, 'child' | 'center'> | null | undefined): boolean {
  return !!u && u.child === false && !u.center
}

/** Body of the 429 the chat route returns when Free's daily limit is used up. Kids get no trial/upgrade text. */
export function freeLimitBody(limit: number, child: boolean) {
  return child
    ? { error: `You've used today's ${limit} free questions. Come back tomorrow for more!`, upgrade: true, child: true }
    : { error: `Free limit reached (${limit}/day). Try Pro free for 7 days for more help.`, upgrade: true }
}
