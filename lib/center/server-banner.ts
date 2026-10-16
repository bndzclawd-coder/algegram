import { createServiceClient } from '@/lib/supabase/server'
import { centerSeatStatus, readCenterCookie } from '@/lib/center/link'
import { centerDisplayName } from '@/lib/center/display'

/** Server-side center-link state from the signed cookie (for server-rendered banners). */
export async function centerLinkState(): Promise<{ full: boolean; center: string | null }> {
  const slug = readCenterCookie()
  if (!slug) return { full: false, center: null }
  const db = createServiceClient() as any
  const status = await centerSeatStatus(db, slug)
  if (status === 'full') return { full: true, center: null }
  if (status !== 'open') return { full: false, center: null }
  const { data } = await db.from('center_pilots').select('display_name').eq('center_slug', slug).maybeSingle()
  return { full: false, center: centerDisplayName(slug, data?.display_name) }
}
