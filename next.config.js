/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return ['/pro', '/plans', '/premium', '/subscribe', '/go-pro'].map(source => ({ source, destination: '/pricing', permanent: true }))
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'algegram.xyz', 'www.algegram.xyz'],
    },
  },
}

module.exports = nextConfig
