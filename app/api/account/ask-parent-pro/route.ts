import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isChildAccount } from '@/lib/account/age-gate'
import { SITE_URL } from '@/lib/site-config'
import { parentProLink } from '@/lib/account/parent-checkout'

export const dynamic = 'force-dynamic'
const DAY_MS = 24 * 60 * 60 * 1000

// A child asks a parent about Pro. One short note per child per 24h, to the parent email on file,
// with no child data (no name, email, questions or usage).
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createServiceClient()
  if (!(await isChildAccount(db, user))) return NextResponse.json({ error: 'Not available for this account.' }, { status: 400 })

  const parent = String(user.user_metadata?.parent_email ?? '').trim()
  if (!parent || !parent.includes('@')) return NextResponse.json({ error: 'We could not find a parent email on file. Ask your grown-up to email support@algegram.xyz.' }, { status: 400 })

  const last = Date.parse(String(user.app_metadata?.ask_parent_pro_at ?? ''))
  if (Number.isFinite(last) && Date.now() - last < DAY_MS) return NextResponse.json({ ok: true, alreadySent: true })

  // Record first (app_metadata is server-only) so retries can't spam the parent.
  const { error: upErr } = await db.auth.admin.updateUserById(user.id, { app_metadata: { ...(user.app_metadata ?? {}), ask_parent_pro_at: new Date().toISOString() } })
  if (upErr) return NextResponse.json({ error: 'Please try again later.' }, { status: 503 })

  const payLink = parentProLink(user.id, parent)
  const text = `Hi,

Your child asked about Algegram Pro on the Algegram account you approved.

Pro is $12.99/month with a 7-day free trial and adds practice questions, quizzes, weak-spot practice, Layla whiteboard lessons and a weekly progress report.

See what's included: ${SITE_URL}/pricing${payLink ? `
Start Pro for your child (7-day free trial, billed to you, cancel anytime): ${payLink}
This link works for 7 days. Checkout uses only your email; we don't send your child's details to our payment provider.` : ''}
Questions or want to set it up? Reply to this email or write to support@algegram.xyz.

You're getting this because your child tapped "Ask a parent about Pro". We send at most one of these a day. No action is needed if you're not interested.

Algegram`
  try {
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: 'Algegram <support@algegram.xyz>', to: parent, reply_to: 'support@algegram.xyz',
      subject: 'Your child asked about Algegram Pro', text,
    })
    if (error) throw new Error(error.name)
  } catch (e) {
    console.error('[ask-parent] send failed', { name: (e as Error)?.message })
    await db.auth.admin.updateUserById(user.id, { app_metadata: { ...(user.app_metadata ?? {}), ask_parent_pro_at: null } })
    return NextResponse.json({ error: 'Could not send right now. Please try again later.' }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
