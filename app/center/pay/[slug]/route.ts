import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { CENTER_PLAN } from '@/lib/center'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
// Existing Center Starter price ($59/mo, 10 seats). No price changes here.
const CENTER_STARTER_PRICE = process.env.STRIPE_CENTER_STARTER_PRICE_ID || 'price_1UQaZm1lk3QGVovbRzbwQxLx'
const H = { 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' }

// Per-center pay link: only for centers with a center_pilots record; ties the payment to that pilot.
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const raw = String(params.slug ?? '')
  if (!/^[a-z0-9_-]{1,40}$/.test(raw)) return new NextResponse('Not found', { status: 404, headers: H })
  const slug = raw.replace(/-/g, '_')
  const { data } = await createServiceClient().from('center_pilots').select('center_slug').eq('center_slug', slug).maybeSingle()
  if (!data) return new NextResponse('Not found', { status: 404, headers: H })
  const origin = 'https://algegram.xyz'
  try {
    const meta = { plan: CENTER_PLAN, seats: '10', center_slug: slug }
    const session = await stripe.checkout.sessions.create(({
      mode: 'subscription',
      // The Center Starter product is sold with Stripe Managed Payments (same as the existing payment link).
      managed_payments: { enabled: true },
      line_items: [{ price: CENTER_STARTER_PRICE, quantity: 1 }],
      client_reference_id: slug,
      metadata: meta,
      subscription_data: { metadata: meta },
      success_url: `${origin}/center/pay/done?status=ok`,
      cancel_url: `${origin}/center/pay/done?status=cancel`,
    }) as any, { apiVersion: '2025-03-31.basil' } as any) // Managed Payments needs basil+; per-request only
    return NextResponse.redirect(session.url!, { status: 303, headers: H })
  } catch (e: any) {
    console.error('[center-pay] checkout failed', { type: e?.type, code: e?.code, param: e?.param, message: e?.message })
    return new NextResponse('Could not start checkout. Please try again.', { status: 503, headers: H })
  }
}
