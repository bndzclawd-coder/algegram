import { NextRequest } from 'next/server'
import { lessonAccess } from '@/lib/whiteboard/access'

export const dynamic = 'force-dynamic'

// Read-only: can this visitor start a lesson right now?
export async function GET(req: NextRequest) {
  return lessonAccess(req, false)
}
