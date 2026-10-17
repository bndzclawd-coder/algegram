import { NextResponse, type NextRequest } from 'next/server'
import { getAdminUser, loadRawSignup } from '@/lib/admin/server'
import { revealEmail } from '@/lib/admin/signups'

export const dynamic = 'force-dynamic'

const NO_STORE = { 'Cache-Control': 'private, no-store, max-age=0', 'X-Robots-Tag': 'noindex, nofollow' }
const notFound = () => new NextResponse('Not found', { status: 404, headers: NO_STORE })

// Owner-only: one account's email (the parent's for under-13s). Nothing is logged.
export async function GET(req: NextRequest) {
  if (!(await getAdminUser())) return notFound()
  const row = await loadRawSignup(req.nextUrl.searchParams.get('id') ?? '')
  if (!row) return notFound()
  return NextResponse.json({ email: revealEmail(row) }, { headers: NO_STORE })
}
