/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'algegram.xyz', 'www.algegram.xyz'],
    },
  },
}

module.exports = nextConfig
