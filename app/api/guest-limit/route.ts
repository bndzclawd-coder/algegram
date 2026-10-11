import { NextRequest, NextResponse } from 'next/server'
import { GUEST_LIMIT, guestSecret, readGuestCount } from '@/lib/guest-limit'

// Read-only status for the homepage counter. The limit itself is checked AND incremented
// by /api/chat; POST is kept read-only for backwards compatibility with old clients.
function status(req: NextRequest) {
  const secret = guestSecret()
  if (!secret) {
    return NextResponse.json({ error: 'Guest questions are temporarily unavailable.', remaining: 0, total: GUEST_LIMIT }, { status: 503 })
  }
  const remaining = Math.max(0, GUEST_LIMIT - readGuestCount(req, secret))
  return NextResponse.json({ remaining, total: GUEST_LIMIT })
}

export const GET = status
export const POST = status
