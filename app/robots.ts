import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site-config'

// Private app, auth, API, center pay and pilot links stay out of search. Public pages are open,
// including to AI search crawlers (explicitly allowed below).
const PRIVATE = ['/api/', '/chat', '/settings', '/auth/', '/practice', '/test', '/upgrade', '/parent/', '/center/', '/p/']
const AI_AND_SEARCH = ['OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Google-Extended', 'Bingbot']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...AI_AND_SEARCH.map(userAgent => ({ userAgent, allow: '/', disallow: PRIVATE })),
      { userAgent: '*', allow: '/', disallow: PRIVATE },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
