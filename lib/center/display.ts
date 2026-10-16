/** Display name for a center: stored name, else a title-cased slug. */
export function centerDisplayName(slug: string, stored?: string | null) {
  return stored?.trim() || slug.split('_').filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
}
