import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { withAttribution } from '@/lib/attribution/middleware'
import { isAdminUser } from '@/lib/admin/signups'

// Routes that need a signed-in user. Only these pay for the Supabase session check;
// public pages just get the first-touch attribution cookie.
function isProtected(pathname: string) {
  return (
    pathname === '/chat' || pathname.startsWith('/chat/') ||
    pathname === '/settings' || pathname.startsWith('/settings/') ||
    pathname === '/practice' || pathname === '/test' ||
    pathname === '/api/stripe/portal' ||
    pathname === '/api/account/delete'
  )
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Supabase falls back to the site root when redirectTo isn't in its allowlist.
  if (pathname === '/' && request.nextUrl.searchParams.get('code')) {
    const sp = request.nextUrl.searchParams
    const url = request.nextUrl.clone()
    url.pathname = '/auth/callback'
    url.search = ''
    url.searchParams.set('code', sp.get('code')!)
    url.searchParams.set('next', sp.get('type') === 'recovery' ? '/auth/update-password' : '/chat')
    return NextResponse.redirect(url)
  }

  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/api/admin/')
  if (!isProtected(pathname) && !isAdmin) {
    return withAttribution(request, NextResponse.next({ request }))
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Owner-only admin: anyone else (incl. logged out) sees a plain 404, never a login redirect.
  if (isAdmin && !isAdminUser(user)) {
    const h = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' }
    if (pathname.startsWith('/api/')) return new NextResponse('Not found', { status: 404, headers: h })
    const url = request.nextUrl.clone()
    url.pathname = '/_admin-not-found'
    url.search = ''
    const res = NextResponse.rewrite(url, { status: 404 })
    Object.entries(h).forEach(([k, v]) => res.headers.set(k, v))
    return res
  }

  if (!user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.search = ''
    url.searchParams.set('next', pathname)
    return withAttribution(request, NextResponse.redirect(url))
  }

  return withAttribution(request, supabaseResponse)
}

export const config = {
  // Pages + the two protected API routes. Skips other API routes, Next internals and static files.
  matcher: [
    '/api/stripe/portal',
    '/api/account/delete',
    '/api/admin/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|og-image.png|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|svg|webp|ico|css|js|txt|xml)$).*)',
  ],
}
