-- Center Starter subscriptions (paid seats for a center's pilot accounts) + day-5 trial email marker.
alter table public.user_profiles add column if not exists trial_ending_sent_at timestamptz;

create table if not exists public.center_subscriptions (
  stripe_subscription_id text primary key,
  stripe_customer_id     text,
  center_slug            text,            -- matches user_profiles.comp_reason 'pilot:<slug>'; null when unmatched
  seats                  int not null default 10 check (seats between 1 and 500),
  status                 text not null,
  current_period_end     timestamptz,
  matched                boolean not null default false,
  match_method           text,            -- 'center_name' | 'payer_email' | null
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index if not exists center_subscriptions_slug_idx on public.center_subscriptions (center_slug);
alter table public.center_subscriptions enable row level security;
revoke all on table public.center_subscriptions from public, anon, authenticated;
revoke all on table public.user_profiles from public, anon, authenticated;
