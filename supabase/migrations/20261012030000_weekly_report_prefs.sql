-- Pro weekly progress report opt-in. NOT applied automatically; run before deploying the code that uses it.
-- Privacy: holds only an opt-in flag and the last send time. Reports are built from practice_results
-- (topic + score only) at send time and never stored.
create table if not exists public.report_prefs (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  weekly_report boolean not null default false,
  last_sent_at  timestamptz,
  updated_at    timestamptz not null default now()
);
create index if not exists report_prefs_weekly_idx on public.report_prefs (weekly_report) where weekly_report;
alter table public.report_prefs enable row level security;
revoke all on public.report_prefs from public, anon, authenticated;
-- Read/write only server-side with the service role.
