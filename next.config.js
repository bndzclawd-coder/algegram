/** @type {import('next').NextConfig} */
const nextConfig = {
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
