-- Pro practice + tests. NOT applied automatically; run before deploying the code that uses it.
-- Privacy: stores only a topic tag from the fixed list, the score and total. No question text, no answers.

create table if not exists public.practice_results (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  topic      text not null check (topic in ('arithmetic','fractions','decimals','percentages','linear-equations',
                                            'quadratics','geometry','functions','derivatives','integrals')),
  score      int  not null check (score >= 0),
  total      int  not null check (total > 0 and score <= total),
  created_at timestamptz not null default now()
);
create index if not exists practice_results_user_created_idx on public.practice_results (user_id, created_at desc);

alter table public.practice_results enable row level security;
revoke all on public.practice_results from public, anon, authenticated;
grant select on public.practice_results to authenticated;
-- Users can read only their own rows. Inserts happen server-side with the service role.
drop policy if exists "practice_results_select_own" on public.practice_results;
create policy "practice_results_select_own" on public.practice_results
  for select to authenticated using (auth.uid() = user_id);

-- Hard daily cap on practice/test generations (separate counter, same atomic pattern as increment_usage).
create table if not exists public.practice_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null,
  count   int  not null default 0,
  primary key (user_id, day)
);
alter table public.practice_usage enable row level security;
revoke all on public.practice_usage from public, anon, authenticated;

create or replace function public.increment_practice_usage(p_user_id uuid, p_day date, p_limit int)
returns int language sql security definer set search_path = public as $$
  insert into public.practice_usage as u (user_id, day, count) values (p_user_id, p_day, 1)
  on conflict (user_id, day) do update set count = u.count + 1 where u.count < p_limit
  returning u.count;
$$;
revoke all on function public.increment_practice_usage(uuid, date, int) from public, anon, authenticated;
grant execute on function public.increment_practice_usage(uuid, date, int) to service_role;

-- 90-day retention: extend the existing cleanup function (called daily by /api/cron/cleanup).
create or replace function public.cleanup_old_usage()
returns int language plpgsql security definer set search_path = public as $$
declare n int; m int; p int; r int;
begin
  delete from public.usage where day < (current_date - 90);
  get diagnostics n = row_count;
  delete from public.premium_usage where day < (current_date - 90);
  get diagnostics m = row_count;
  delete from public.practice_usage where day < (current_date - 90);
  get diagnostics p = row_count;
  delete from public.practice_results where created_at < (now() - interval '90 days');
  get diagnostics r = row_count;
  return n + m + p + r;
end;
$$;
revoke all on function public.cleanup_old_usage() from public, anon, authenticated;
grant execute on function public.cleanup_old_usage() to service_role;
