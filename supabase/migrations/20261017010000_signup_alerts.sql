-- One internal "New real signup" alert per family (see lib/admin/signup-alert.ts).
-- key_hash = HMAC of the family email (parent's email for under-13s). No emails, names or IPs stored.
create table if not exists public.signup_alerts (
  key_hash text primary key,
  sent_at  timestamptz not null default now()
);
alter table public.signup_alerts enable row level security;
-- No policies: only the service role (bypasses RLS) touches this table.
revoke all on table public.signup_alerts from public, anon, authenticated;
grant select, insert on table public.signup_alerts to service_role;
