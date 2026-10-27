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
      // Short, easy-to-type links for Instagram captions (captions aren't clickable). Temporary (307) so they
      // can be repointed for later Reels; the utm query lets the first-visit ag_attr cookie record the campaign.
      // Not in the sitemap. Keep sources clear of real routes in app/.
      ...[
        ['/5x', '/solve/5x-minus-8-equals-27', 'timer_5x'],
        ['/x6', '/solve/x-plus-6-over-2-equals-9', 'timer_x6'],
        ['/x3', '/solve/x-over-3-plus-4-equals-10', 'timer_x3'],
        ['/2x', '/solve/2x-plus-5-equals-17', 'timer_2x'],
        ['/3x', '/solve/3-x-minus-2-equals-15', 'timer_3x'],
        ['/x4', '/solve/x-over-4-minus-3-equals-2', 'timer_x4'],
        ['/4x', '/solve/4x-plus-7-equals-31', 'timer_4x'],
        ['/2x3', '/solve/2-x-plus-3-equals-14', 'timer_2x3'],
        ['/x19', '/solve/x-minus-4-over-3-equals-5', 'timer_x19'],
        ['/x14', '/solve/x-plus-10-over-4-equals-6', 'timer_x14'],
      ].map(([source, path, campaign]) => ({ source, destination: `${path}?utm_source=instagram&utm_medium=social&utm_campaign=${campaign}`, permanent: false })),
      // Parent share link: temporary (307) to the kid-safe /ask page with share attribution. Not in the sitemap.
      { source: '/try', destination: '/ask?utm_source=share&utm_medium=referral&utm_campaign=parent_share', permanent: false },
    ]
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'algegram.xyz', 'www.algegram.xyz'],
    },
  },
}

module.exports = nextConfig
