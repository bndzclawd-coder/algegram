import type { MetadataRoute } from 'next'

const BASE = 'https://www.algegram.xyz'

export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date().toISOString()

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: today, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/pricing`, lastModified: today, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/terms`, lastModified: today, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/privacy`, lastModified: today, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/contact`, lastModified: today, changeFrequency: 'monthly', priority: 0.5 },
  ]

  const topics = ['algebra', 'calculus', 'fractions', 'statistics', 'linear-algebra', 'number-theory']
  const topicPages: MetadataRoute.Sitemap = topics.map(t => ({
    url: `${BASE}/solve/${t}`,
    lastModified: today,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...topicPages]
}
