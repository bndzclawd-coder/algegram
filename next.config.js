/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'algegram.xyz', 'www.algegram.xyz'],
    },
  },
  // Homepage prototype (app/preview) for UAT only (not linked, not in sitemap, noindex).
  async headers() {
    return [{ source: '/preview/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
            { source: '/preview', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }]
  },
}

module.exports = nextConfig
