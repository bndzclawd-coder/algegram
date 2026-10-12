import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { startProCheckout } from '@/lib/account/checkout'

export const dynamic = 'force-dynamic'

// Every "Try Pro" / "Upgrade" CTA lands here and goes straight into the current checkout flow.
export async function GET(req: NextRequest) {
  const to = (path: string) => NextResponse.redirect(new URL(path, req.nextUrl.origin), 303)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return to('/auth/signup?plan=pro')
  try {
    const r = await startProCheckout(createServiceClient(), user)
    if (r.kind === 'child') return to('/chat?askparent=1')
    if (r.kind === 'error') return to('/pricing')
    return NextResponse.redirect((r as any).url, 303)
  } catch (e) {
    console.error('[upgrade] failed', { name: (e as Error)?.name })
    return to('/pricing')
  }
}
