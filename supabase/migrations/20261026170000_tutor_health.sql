-- Single-row state for the hourly tutor health check (app/api/health/tutor). Status codes and counts only; no text.
create table if not exists public.tutor_health (
  id int primary key default 1 check (id = 1),
  consecutive_failures int not null default 0,
  alerted boolean not null default false,
  last_ok boolean,
  last_status int,
  last_model text,
  checked_at timestamptz
);
alter table public.tutor_health enable row level security;
-- No policies: only the service role (bypasses RLS) touches this table.
revoke all on table public.tutor_health from public, anon, authenticated;
grant select, insert, update on table public.tutor_health to service_role;
insert into public.tutor_health (id) values (1) on conflict do nothing;
