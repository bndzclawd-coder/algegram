-- Layla whiteboard lessons: per-day counter for signed-in Free accounts (Pro is unlimited; guests use a cookie).
-- NOT applied automatically. Additive. Run before deploying the code that uses it.
create table if not exists public.lesson_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null,
  count   int  not null default 0,
  primary key (user_id, day)
);
alter table public.lesson_usage enable row level security;
revoke all on public.lesson_usage from public, anon, authenticated;

create or replace function public.increment_lesson_usage(p_user_id uuid, p_day date, p_limit int)
returns int language sql security definer set search_path = public as $$
  insert into public.lesson_usage as u (user_id, day, count) values (p_user_id, p_day, 1)
  on conflict (user_id, day) do update set count = u.count + 1 where u.count < p_limit
  returning u.count;
$$;
revoke all on function public.increment_lesson_usage(uuid, date, int) from public, anon, authenticated;
grant execute on function public.increment_lesson_usage(uuid, date, int) to service_role;

-- 90-day retention: keep every existing cleanup and add lesson_usage.
create or replace function public.cleanup_old_usage()
returns int language plpgsql security definer set search_path = public as $$
declare n int; m int; p int; r int; l int;
begin
  delete from public.usage where day < (current_date - 90);
  get diagnostics n = row_count;
  delete from public.premium_usage where day < (current_date - 90);
  get diagnostics m = row_count;
  delete from public.practice_usage where day < (current_date - 90);
  get diagnostics p = row_count;
  delete from public.practice_results where created_at < (now() - interval '90 days');
  get diagnostics r = row_count;
  delete from public.lesson_usage where day < (current_date - 90);
  get diagnostics l = row_count;
  return n + m + p + r + l;
end;
$$;
revoke all on function public.cleanup_old_usage() from public, anon, authenticated;
grant execute on function public.cleanup_old_usage() to service_role;
