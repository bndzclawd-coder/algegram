-- PR #4: Pro fair-use counter + 90-day usage retention. NOT applied automatically; run before deploying.

-- 1. Pro premium-model messages per user per day (separate from Free `usage`).
create table if not exists public.premium_usage (
  user_id  uuid not null references auth.users(id) on delete cascade,
  day      date not null,
  count    int  not null default 0,
  primary key (user_id, day)
);
alter table public.premium_usage enable row level security;
revoke all on public.premium_usage from public, anon, authenticated;

-- Returns new count, or NULL if already at p_limit (caller falls back to the free model).
create or replace function public.increment_premium_usage(p_user_id uuid, p_day date, p_limit int)
returns int language sql security definer set search_path = public as $$
  insert into public.premium_usage as u (user_id, day, count) values (p_user_id, p_day, 1)
  on conflict (user_id, day) do update set count = u.count + 1 where u.count < p_limit
  returning u.count;
$$;
revoke all on function public.increment_premium_usage(uuid, date, int) from public, anon, authenticated;
grant execute on function public.increment_premium_usage(uuid, date, int) to service_role;

-- 2. Retention: delete usage counters older than 90 days.
create or replace function public.cleanup_old_usage()
returns int language plpgsql security definer set search_path = public as $$
declare n int; m int;
begin
  delete from public.usage where day < (current_date - 90);
  get diagnostics n = row_count;
  delete from public.premium_usage where day < (current_date - 90);
  get diagnostics m = row_count;
  return n + m;
end;
$$;
revoke all on function public.cleanup_old_usage() from public, anon, authenticated;
grant execute on function public.cleanup_old_usage() to service_role;

-- Scheduling: the Vercel cron (vercel.json -> /api/cron/cleanup, needs CRON_SECRET) calls this daily.
-- Alternative if pg_cron is enabled:
--   select cron.schedule('cleanup-old-usage', '15 3 * * *', 'select public.cleanup_old_usage(); select public.cleanup_rate_limits();');
