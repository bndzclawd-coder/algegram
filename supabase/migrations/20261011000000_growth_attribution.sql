-- Growth: signup attribution + lifecycle email state.
-- NOT applied automatically. Review, then run in the Supabase SQL editor (or `supabase db push`).
-- The app tolerates this table being absent (it logs and continues), so deploy order is flexible.
--
-- PRIVACY RULE: these columns hold only campaign labels we put in our own links (ref, utm_*),
-- the landing path and a date. No IP, no user agent. Internal reporting only: never send to
-- ad platforms / pixels and never use for retargeting (COPPA).

create table if not exists public.user_attribution (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  signup_ref           text,                 -- short label: ref, else utm_source
  signup_attribution   jsonb,                -- {ref, utm_source, utm_medium, utm_campaign, landing_path, first_seen}
  marketing_opt_out    boolean not null default false,
  last_limit_email_at  timestamptz,
  created_at           timestamptz not null default now()
);

create index if not exists user_attribution_signup_ref_idx on public.user_attribution (signup_ref);

alter table public.user_attribution enable row level security;

-- Server (service role) only. No policies for anon/authenticated users.
drop policy if exists "service role full access user_attribution" on public.user_attribution;
create policy "service role full access user_attribution"
  on public.user_attribution for all
  using (auth.role() = 'service_role');

-- Handy report: signups by source.
-- select coalesce(signup_ref, '(direct)') as source, count(*) from public.user_attribution group by 1 order by 2 desc;
