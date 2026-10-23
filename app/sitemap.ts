import { LEGAL_PAGES_REVIEWED } from '@/lib/site-config'
import type { MetadataRoute } from 'next'
import { LEARN_SLUGS } from '@/lib/learn/data'
import { SITE_URL as BASE } from '@/lib/site-config'

// Only indexable, ready pages. /ai-math-tutor-for-kids is deliberately left out (noindex) until
// the parental-consent / privacy features it describes are confirmed live.
export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date().toISOString()

  const pages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: today, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/quadratic-equation-solver`, lastModified: today, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/fraction-calculator`, lastModified: today, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/pricing`, lastModified: today, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/how-algegram-works-for-kids`, lastModified: today, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/challenges`, lastModified: today, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/help`, lastModified: today, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/contact`, lastModified: today, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/privacy`, lastModified: today, changeFrequency: "monthly" as const, priority: 0.3 },
    ...(LEGAL_PAGES_REVIEWED ? [{ url: `${BASE}/terms`, lastModified: today, changeFrequency: 'monthly' as const, priority: 0.3 }] : []),
    { url: `${BASE}/billing`, lastModified: today, changeFrequency: "monthly" as const, priority: 0.3 },
  ]

  const topics = ['fractions', 'linear-equations', 'percentages', 'order-of-operations', 'word-problems', 'algebra', 'calculus', 'statistics', 'linear-algebra', 'number-theory', '2x-plus-5-equals-17', '3-x-minus-2-equals-15', 'x-over-4-minus-3-equals-2', 'x-over-3-plus-4-equals-10', '5x-minus-8-equals-27', 'x-plus-6-over-2-equals-9', '4x-plus-7-equals-31', '2-x-plus-3-equals-14']
  const topicPages: MetadataRoute.Sitemap = topics.map(t => ({
    url: `${BASE}/solve/${t}`,
    lastModified: today,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const quizPages: MetadataRoute.Sitemap = ['fractions', 'linear-equations', 'percentages', 'order-of-operations', 'word-problems']
    .map(t => ({ url: `${BASE}/quiz/${t}`, lastModified: today, changeFrequency: 'monthly' as const, priority: 0.6 }))

  const learnPages: MetadataRoute.Sitemap = ['', ...LEARN_SLUGS.map(s => `/${s}`)]
    .map(s => ({ url: `${BASE}/learn${s}`, lastModified: today, changeFrequency: 'monthly' as const, priority: 0.7 }))

  return [...pages, ...topicPages, ...quizPages, ...learnPages]
}
