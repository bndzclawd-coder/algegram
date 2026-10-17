/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    // Private owner pages: never indexed, never cached by a browser or CDN.
    const h = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }, { key: 'Cache-Control', value: 'private, no-store, max-age=0' }]
    return [{ source: '/admin', headers: h }, { source: '/admin/:path*', headers: h }, { source: '/api/admin/:path*', headers: h }]
  },
  async redirects() {
    return [
      ...['/pro', '/plans', '/premium', '/subscribe', '/go-pro'].map(source => ({ source, destination: '/pricing', permanent: true })),
      { source: '/ai-math-tutor-for-kids-under-13', destination: '/how-algegram-works-for-kids', permanent: true },
    ]
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'algegram.xyz', 'www.algegram.xyz'],
    },
  },
}

module.exports = nextConfig
