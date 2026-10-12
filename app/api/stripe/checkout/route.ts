import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { startProCheckout } from '@/lib/account/checkout'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const r = await startProCheckout(createServiceClient(), user)
  if (r.kind === 'child') return NextResponse.json({ error: 'Ask a parent about Pro.', child: true }, { status: 403 })
  if (r.kind === 'error') return NextResponse.json({ error: (r as any).error }, { status: (r as any).status })
  return NextResponse.json({ url: (r as any).url, ...(r.kind === 'portal' ? { portal: true } : {}) })
}
