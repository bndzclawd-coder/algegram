-- PR #4: DB-backed rate limits (guest per-IP backstop, consent endpoint) + server-verified age.
-- NOT applied automatically. Run in the Supabase SQL editor BEFORE deploying PR #4
-- (the code fails closed: guest chat / consent / signup return 503 if these objects are missing).

-- 1. Rate-limit buckets -------------------------------------------------------
-- PRIVACY: `bucket` is sha256(secret : kind : UTC day : value), computed in the app.
-- No raw IP or email is ever stored, the day is part of the hash (no cross-day linkage),
-- rows expire after a few hours, and nothing here references users, questions or analytics.
create table if not exists public.rate_limit_buckets (
  bucket      text primary key,
  count       int not null default 0,
  expires_at  timestamptz not null
);
create index if not exists rate_limit_buckets_expires_idx on public.rate_limit_buckets (expires_at);

alter table public.rate_limit_buckets enable row level security;
-- No policies: anon/authenticated get nothing. Service role bypasses RLS.
revoke all on public.rate_limit_buckets from public, anon, authenticated;

-- Atomic check-and-increment. Returns true if the hit is allowed (and counted).
create or replace function public.consume_rate_limit(p_bucket text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  -- Opportunistic cleanup (~1% of calls) so the table stays tiny even without pg_cron.
  if random() < 0.01 then
    delete from public.rate_limit_buckets where expires_at < now();
  end if;

  insert into public.rate_limit_buckets as b (bucket, count, expires_at)
  values (p_bucket, 1, now() + make_interval(secs => p_window_seconds))
  on conflict (bucket) do update
    set count      = case when b.expires_at < now() then 1 else b.count + 1 end,
        expires_at = case when b.expires_at < now() then now() + make_interval(secs => p_window_seconds) else b.expires_at end
    where b.expires_at < now() or b.count < p_limit
  returning b.count into v_count;

  return v_count is not null;
end;
$$;

create or replace function public.cleanup_rate_limits()
returns void language sql security definer set search_path = public as $$
  delete from public.rate_limit_buckets where expires_at < now();
$$;

revoke all on function public.consume_rate_limit(text, int, int) from public, anon, authenticated;
revoke all on function public.cleanup_rate_limits() from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, int, int) to service_role;
grant execute on function public.cleanup_rate_limits() to service_role;

-- Optional, if pg_cron is enabled:
-- select cron.schedule('cleanup-rate-limits', '*/30 * * * *', 'select public.cleanup_rate_limits()');

-- 2. Server-verified age ------------------------------------------------------
-- Rows are written ONLY by server routes (service role): /api/auth/signup, /api/account/birth-year
-- and the parental-consent approve route. /api/chat refuses signed-in users without age_verified,
-- which closes the "call supabase.auth.signUp directly with the anon key" bypass.
create table if not exists public.user_profiles (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  birth_year        int not null check (birth_year between 1900 and 2100),
  age_verified      boolean not null default false,
  parental_consent  boolean not null default false,
  created_at        timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
revoke all on public.user_profiles from public, anon, authenticated;

-- Backfill accounts created by the existing parental-consent flow (birth year in admin-set metadata).
insert into public.user_profiles (user_id, birth_year, age_verified, parental_consent)
select id, (raw_user_meta_data->>'birth_year')::int, true, true
from auth.users
where raw_user_meta_data->>'parental_consent' = 'true'
  and (raw_user_meta_data->>'birth_year') ~ '^[0-9]{4}$'
on conflict (user_id) do nothing;
-- Other existing users have no profile yet; they are asked for their birth year once (/auth/age).
