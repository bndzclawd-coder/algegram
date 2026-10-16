-- Quiz scores for signed-in users + center reports by seat number.
-- Privacy: stores topic + score + total only (no question text, no answers, no names). Guests are never saved.
-- Retention: practice_results rows are already deleted after 90 days by public.cleanup_old_usage().

-- 1) Allow the two new quiz topics and tag where a score came from.
alter table public.practice_results drop constraint if exists practice_results_topic_check;
alter table public.practice_results add constraint practice_results_topic_check check (topic = any (array[
  'arithmetic','fractions','decimals','percentages','linear-equations','quadratics','geometry','functions','derivatives','integrals',
  'order-of-operations','word-problems'
]::text[]));
alter table public.practice_results add column if not exists source text not null default 'practice';
alter table public.practice_results drop constraint if exists practice_results_source_check;
alter table public.practice_results add constraint practice_results_source_check check (source in ('practice', 'quiz'));

-- 2) Center seats: a student account is linked to its enrolling center by seat number only.
create table if not exists public.center_seats (
  center_slug text not null check (center_slug ~ '^[a-z0-9_]{1,40}$'),
  seat_no     int  not null check (seat_no between 1 and 500),
  user_id     uuid not null unique references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (center_slug, seat_no)
);
-- Center logins: staff accounts allowed to see their own center's report.
create table if not exists public.center_staff (
  center_slug text not null check (center_slug ~ '^[a-z0-9_]{1,40}$'),
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (center_slug, user_id)
);
alter table public.center_seats enable row level security;
alter table public.center_staff enable row level security;
revoke all on public.center_seats from public, anon, authenticated;
revoke all on public.center_staff from public, anon, authenticated;
-- No client policies: only the server (service role) manages seats and staff.

-- 3) Report: seat number + topic + score only, only for staff of that center.
create or replace function public.center_score_report(p_center text, p_days int default 30)
returns table (seat_no int, topic text, score int, total int, source text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select s.seat_no, r.topic, r.score, r.total, r.source, r.created_at
    from public.center_seats s
    join public.practice_results r on r.user_id = s.user_id
   where s.center_slug = p_center
     and exists (select 1 from public.center_staff st where st.center_slug = p_center and st.user_id = auth.uid())
     and r.created_at >= now() - make_interval(days => least(greatest(coalesce(p_days, 30), 1), 90))
   order by s.seat_no, r.created_at desc
$$;
revoke all on function public.center_score_report(text, int) from public, anon;
grant execute on function public.center_score_report(text, int) to authenticated;
