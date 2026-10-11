import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/site-config'

// TODO(og): /og-image.png is the generic brand card. Per-topic OG images would lift CTR on shares.
const OG_IMAGE = { url: '/og-image.png', width: 1200, height: 630, alt: 'Algegram: step-by-step AI math help' }

/**
 * Full per-page metadata. Next merges metadata shallowly, so a page that sets `openGraph`
 * would otherwise lose the layout's og:image; always build page metadata through this helper.
 * `title` is used verbatim (no "| Algegram" template suffix added).
 */
export function pageMetadata(o: { title: string; description: string; path: string; noindex?: boolean }): Metadata {
  return {
    title: { absolute: o.title },
    description: o.description,
    alternates: { canonical: o.path },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      url: o.path,
      title: o.title,
      description: o.description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: o.title,
      description: o.description,
      images: [OG_IMAGE.url],
    },
    ...(o.noindex ? { robots: { index: false, follow: true } } : {}),
  }
}
