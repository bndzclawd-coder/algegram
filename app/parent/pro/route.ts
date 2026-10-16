import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { startParentCheckout } from '@/lib/account/parent-checkout'

export const dynamic = 'force-dynamic'

// Link from the parent email: opens Stripe Checkout under the parent's email for the child's account.
export async function GET(req: NextRequest) {
  const to = (p: string) => NextResponse.redirect(new URL(p, req.nextUrl.origin), 303)
  const t = req.nextUrl.searchParams.get('t')
  if (!t) return to('/parent/pro/done?status=expired')
  try {
    const r = await startParentCheckout(createServiceClient() as any, t)
    if ('url' in r) return NextResponse.redirect(r.url, 303)
    return to(`/parent/pro/done?status=${r.error === 'already' ? 'already' : 'expired'}`)
  } catch (e) {
    console.error('[parent-checkout] failed', { name: (e as Error)?.name })
    return to('/parent/pro/done?status=error')
  }
}
