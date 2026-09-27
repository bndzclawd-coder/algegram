-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)

-- ─── Subscriptions ──────────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id                    uuid default gen_random_uuid() primary key,
  user_id               uuid references auth.users(id) on delete cascade not null unique,
  stripe_customer_id    text unique,
  stripe_subscription_id text unique,
  plan                  text not null default 'free', -- 'free' | 'pro'
  status                text not null default 'active', -- 'active' | 'canceled' | 'past_due'
  current_period_end    timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- Auto-create subscription row when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.subscriptions (user_id)
  values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Daily Usage ─────────────────────────────────────────────────────────────
create table if not exists public.usage (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  day         date not null default current_date,
  count       int not null default 0,
  unique (user_id, day)
);

-- ─── Conversations (optional — for history feature) ──────────────────────────
create table if not exists public.conversations (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  title      text,
  messages   jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── RLS Policies ────────────────────────────────────────────────────────────
alter table public.subscriptions enable row level security;
alter table public.usage enable row level security;
alter table public.conversations enable row level security;

-- Users can only read their own subscription
create policy "users read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Service role can update subscriptions (Stripe webhook)
create policy "service role full access subscriptions"
  on public.subscriptions for all
  using (auth.role() = 'service_role');

-- Users can read/update their own usage
create policy "users manage own usage"
  on public.usage for all
  using (auth.uid() = user_id);

create policy "service role full access usage"
  on public.usage for all
  using (auth.role() = 'service_role');

-- Users own their conversations
create policy "users manage own conversations"
  on public.conversations for all
  using (auth.uid() = user_id);
