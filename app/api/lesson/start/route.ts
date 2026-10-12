import { NextRequest } from 'next/server'
import { lessonAccess } from '@/lib/whiteboard/access'

export const dynamic = 'force-dynamic'

// Counts one whiteboard lesson. The request body is ignored: no question or answer text is sent here.
export async function POST(req: NextRequest) {
  return lessonAccess(req, true)
}
