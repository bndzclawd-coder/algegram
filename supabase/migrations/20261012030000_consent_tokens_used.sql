-- Single-use parental consent links. NOT yet applied to live Supabase: needs approval.
-- Stores only a SHA-256 hash of the consent token (never the token, never emails).
create table if not exists public.consent_tokens_used (
  token_hash text primary key,          -- hex sha256 of the signed consent JWT
  action     text not null check (action in ('approve', 'decline')),
  used_at    timestamptz not null default now()
);

alter table public.consent_tokens_used enable row level security;
-- No policies: anon/authenticated get nothing. Only the service role (bypasses RLS) touches this table.
revoke all on table public.consent_tokens_used from public, anon, authenticated;
grant select, insert, delete on table public.consent_tokens_used to service_role;
