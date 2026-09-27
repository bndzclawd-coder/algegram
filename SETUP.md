# Algegram — Setup Guide

## Architecture

```
User → Vercel (Next.js) → /api/chat → OpenRouter (your API key)
                        → /api/stripe/* → Stripe
                        → Supabase (auth + DB)
```

## Step 1: Supabase (Free tier)

1. Go to https://supabase.com → New project
2. Copy your **Project URL** and **anon key** from Settings → API
3. Also copy the **service_role key** (keep this SECRET — server only)
4. Open SQL Editor → paste the contents of `supabase/schema.sql` → Run

## Step 2: Stripe (Free to set up)

1. https://stripe.com → Create account
2. Dashboard → Products → Add product
   - Name: **Algegram**
   - Price: **$12.99 / month** (recurring)
   - Copy the **Price ID** (starts with `price_`)
3. Dashboard → Developers → API keys
   - Copy **Publishable key** (`pk_live_...`) and **Secret key** (`sk_live_...`)
4. Dashboard → Webhooks → Add endpoint
   - URL: `https://your-vercel-url.vercel.app/api/stripe/webhook`
   - Events to listen for:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - Copy the **Signing secret** (`whsec_...`)

## Step 3: OpenRouter

1. https://openrouter.ai → API Keys → Create key
2. Copy your key (`sk-or-v1-...`)
3. Add credits to your account (users consume from YOUR credits)

## Step 4: Deploy to Vercel

1. Push this folder to a new GitHub repo:
   ```bash
   cd algegram
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create algegram --public --push --source=.
   ```

2. Go to https://vercel.com → New Project → Import your repo

3. Add Environment Variables (Settings → Environment Variables):
   ```
   NEXT_PUBLIC_SUPABASE_URL        = https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY   = eyJ...
   SUPABASE_SERVICE_ROLE_KEY       = eyJ...
   OPENROUTER_API_KEY              = sk-or-v1-...
   STRIPE_SECRET_KEY               = sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_...
   STRIPE_WEBHOOK_SECRET           = whsec_...
   STRIPE_PRO_PRICE_ID             = price_...
   NEXT_PUBLIC_APP_URL             = https://your-app.vercel.app
   ```

4. Deploy! Vercel auto-builds on every push.

## Step 5: Update Stripe Webhook URL

After Vercel gives you a URL, update your Stripe webhook endpoint to use it.

## Pricing

| Plan | Price | Messages/day | Models |
|------|-------|-------------|--------|
| Free | $0 | 20 | Qwen3-8B (free) |
| Pro | $12.99/mo | Unlimited | GPT-4o, Claude, Gemini, DeepSeek |

To change the price, edit `lib/stripe.ts` and update your Stripe product.

## Local Development

```bash
cp .env.example .env.local
# Fill in your keys
npm install
npm run dev
# Open http://localhost:3000
```

## Customizing Models

Edit `app/api/chat/route.ts`:
- `FREE_MODEL` — the model free users get
- `PRO_DEFAULT_MODEL` — default for Pro users

Edit `app/chat/page.tsx` → `PRO_MODELS` array to change the model dropdown.

## Revenue Estimate

- 1,000 free users using 20 msgs/day = ~600K msgs/mo
  - OpenRouter free models: **$0**
- 100 Pro users × $12.99 = **$1,299/mo revenue**
  - OpenRouter cost at ~$0.001/msg × 3M msgs = ~$3/mo
  - Stripe fees: ~2.9% + $0.30 = ~$40/mo
  - **Net: ~$1,250/mo**
