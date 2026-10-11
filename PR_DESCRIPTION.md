# Growth: SEO foundations, first-touch attribution, new homepage + 2 topic pages

## Why
Google and Bing haven't indexed algegram.xyz yet. Every page shares one title and description, nothing has a canonical URL or og:image, and there are no topic landing pages. **`main` also fails `next build` at the moment** (`app/page.tsx` calls `redirect()` without importing it, from commit fdd6d47). Production is probably still serving an older deploy: the live site stores the guest limit in localStorage and returns 404 for robots.txt, even though the repo already has both fixed.

## What changed
**Build fixes**
- `app/page.tsx`: import `redirect`, and URL-encode the forwarded `?code=`.
- Removed `next.config.ts`. Next 14 ignores it (`.ts` config needs Next 15+). Its `serverActions.allowedOrigins` setting moved into `next.config.js`.
- Added `.eslintrc.json` (`next/core-web-vitals`) plus eslint devDeps, so `next lint` runs without prompting. `react/no-unescaped-entities` is turned off because of existing apostrophes in legal copy.
- `package-lock.json` is committed.

**SEO**
- `lib/seo.ts` `pageMetadata()` gives every page its own title, description, canonical, og:url, og:image (`/og-image.png`, 1200×630) and `summary_large_image`. It exists because Next merges metadata shallowly: before this, any page that set its own `openGraph` lost the image, and every page inherited the homepage canonical from the layout.
- Root layout: `metadataBase` is https://www.algegram.xyz. Removed the root canonical and the duplicate viewport meta.
- Organization + WebSite JSON-LD on the homepage. The logo is `/icon.png`.
- `app/icon.png` (512) and `app/apple-icon.png` (180) are generated from the brand logo. `public/og-image.png` is the existing brand card.
- `robots.ts` disallows `/api/`, `/chat`, `/settings` and `/auth/`, and points to the sitemap. Auth pages are also `noindex` (`app/auth/layout.tsx`).
- `sitemap.ts` lists home, the 2 new topic pages, pricing, contact, privacy, terms and `/solve/*`.
- `/solve/[topic]`: unknown topics now return a real 404 (`dynamicParams = false`) instead of a soft 404 with status 200.
- Fixed titles like "Contact — Algegram | Algegram" that the template was doubling.
- `--text-dim` changed from #6b6b80 to #9a9ab0 to fix the WCAG contrast failures Lighthouse flagged.

**Homepage** (server component)
- The hero now reads "Try a free question", and the **existing guest solver (`HomepageChat`, 5 free questions via the signed `gl` cookie) is unchanged** apart from these additions:
  - prefills from `?q=` (never auto-sends)
  - anchor is now `#try`
  - kid-friendlier example chips
  - no longer jumps the page on load
- Worked example 2x + 5 = 17, with a check line.
- Topic cards are real `<Link>`s to existing pages only.
- Free vs Pro section, and a pilot request section (mailto).
- Shared `SiteNav`/`SiteFooter` (`components/SiteChrome.tsx`). The Pricing link is now visible on mobile.

**Topic pages**
- `/quadratic-equation-solver` and `/fraction-calculator` each have 3 worked examples and CTAs that link to `/?q=…#try`.
- `/ai-math-tutor-for-kids` is in the codebase but **noindex, not in the sitemap and not linked anywhere**. It describes consent and privacy behaviour that still needs sign-off.

**Attribution** (`lib/attribution/*`, `middleware.ts`)
- First-touch `ag_attr` cookie: httpOnly, 30 days. It holds only `ref`/`utm_source`/`utm_medium`/`utm_campaign` labels (`[a-z0-9._-]`, max 64 characters, no `@`), the landing path and a date. **No IP or user agent.**
- **Rule: internal reporting only. Never sent to ad pixels or platforms, never used for retargeting (COPPA).**
- Middleware now runs on all pages to set the cookie. The Supabase session check still runs only on the protected routes, so public pages don't call Supabase.
- Signup: `/auth/callback` writes the attribution to `public.user_attribution` on first confirmation. Insert-only, and it never blocks signup.
- Stripe Checkout: `client_reference_id = user.id`, plus `metadata.ref` and `subscription_data.metadata.ref` when a ref exists. The webhook still keys on `subscription.metadata.supabase_user_id`, which is unchanged.

**Lifecycle emails** (`lib/email/*`), gated by `LIFECYCLE_EMAILS_ENABLED` (default **off**)
- Welcome: sent from `support@`.
  - Under-13 accounts: an account-only email goes to the **parent** from the consent-approve route, with no promotion.
  - When the flag is off, the existing welcome email keeps going out exactly as it does today.
- Daily limit: sent on a Free user's 20th question of the day. Never to under-13 accounts, at most once every 7 days, and it respects opt-out.
- One-click unsubscribe (`/api/email/unsubscribe`, HMAC token, RFC 8058 POST).

**Offer wording**
- `lib/site-config.ts`: `PRO_CTA_TEXT = "Try Pro"` and `PRO_OFFER_TEXT = null`.
- Pricing page, signup page, homepage and emails show no trial or promo text until the offer is set. Removed the hard-coded "7-day free trial" badge and the "Start Pro free trial" button text.

**Security / hygiene**
- `/pricing` (a client component) imported `PLANS` from `lib/stripe.ts`, which pulls in the Stripe server SDK. Plans now live in `lib/plans.ts`, and `lib/stripe.ts` is server-only.
- Confirmed by grepping `.next/static`: no Stripe, Supabase service role, webhook or guest-cookie secret ends up in client JS.

## DB migration (NOT applied)
`supabase/migrations/20261011000000_growth_attribution.sql` creates `public.user_attribution`:
- `signup_ref`, `signup_attribution` jsonb, `marketing_opt_out`, `last_limit_email_at`
- row-level security restricted to the service role

Review it, then run it in the Supabase SQL editor. The code logs and carries on if the table is missing, so deploy order doesn't matter.

## Env
- `LIFECYCLE_EMAILS_ENABLED=false`. Set it to true only once support@algegram.xyz receives mail.
- Optional: `LIFECYCLE_FROM`, `LIFECYCLE_UNSUB_SECRET` (falls back to `GUEST_COOKIE_SECRET`).
- `GUEST_COOKIE_SECRET` must be set in Vercel (see findings below).

## Tested locally (dummy env values, never committed)
- `tsc --noEmit` ✓, `next lint` ✓, `next build` ✓
- `next start`, then curl:
  - `/`, `/pricing`, `/quadratic-equation-solver`, `/fraction-calculator`, `/solve/algebra` and `/contact` each return 200 with their own title, description, canonical, og:image and `summary_large_image`
  - `/ai-math-tutor-for-kids` returns `noindex, follow`
  - `/solve/bogus` returns 404
  - robots.txt and sitemap.xml are correct, and `/icon.png` and `/og-image.png` return 200
- `?ref=pilot-firecracker&utm_medium=email` sets the cookie. An existing cookie is not overwritten. `?ref=bad@email.com` is rejected.
- `/chat` with no session still redirects to `/auth/login?next=/chat`.
- `/?code=…` forwards to `/auth/callback`.
- Guest-limit GET/POST counts down 5 → 4 through the signed cookie.
- **Not tested** (needs real services): Supabase signup/attribution write, Stripe Checkout, Resend sends, AI answers.

## Follow-ups / findings (not fixed here)
1. **The guest limit can be bypassed.** `/api/chat` only *reads* the `gl` cookie; the count goes up in a separate `/api/guest-limit` call. A script that skips that call, or never sends the cookie, gets unlimited free AI answers. If `GUEST_COOKIE_SECRET` is unset, `/api/chat` treats every guest as having used 0 questions. Fix: increment and sign inside `/api/chat`, and fail closed when the secret is missing.
2. A Pro user's `model` value is passed straight to OpenRouter, so any (expensive) model can be requested. Fix: allow only the models in `PLANS.pro.models`.
3. The guest 502 response returns the raw OpenRouter error to the browser (`detail`).
4. The free-tier usage check and upsert are not atomic, so parallel requests can go past 20 a day. Fix: use an RPC with `count = count + 1`.
5. **next 14.2.16 is flagged as vulnerable** by npm. That includes the middleware-bypass CVE-2025-29927 (Vercel-hosted sites are reportedly not affected, but self-hosting would be). Upgrade to the latest 14.2.x.
6. Checkout still sets `trial_period_days: 7`, and `/terms` still describes a 7-day trial. Site copy is now generic, so align these once the offer is decided (Revenue).
7. The legacy welcome email (on by default) comes from `noreply@` but says "just reply to this email", and its links point to the apex domain rather than www.
8. Under-13 detection is client-side only on `/auth/signup`. The 13+ path stores no birth year, so the server can't tell a child's account apart.
9. Homepage JSON-LD is still a generic brand graph. Per-page `HowTo`/`FAQ` structured data could come later.
10. TODO: per-topic OG images; more topic pages (only link ones that exist).
