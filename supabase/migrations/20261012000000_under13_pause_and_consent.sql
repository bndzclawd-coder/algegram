-- PR #5: existing accounts paused as under-13 (/auth/age).
-- NOT applied automatically. Run in the Supabase SQL editor BEFORE deploying PR #5
-- (the code reads/writes these columns; without them the pause/consent routes return 503).

alter table public.user_profiles
  add column if not exists paused_at      timestamptz,  -- set when an under-13 account is paused; cleared on consent
  add column if not exists billing_paused boolean not null default false; -- we paused Stripe collection

create index if not exists user_profiles_paused_idx
  on public.user_profiles (paused_at) where age_verified = false and paused_at is not null;

-- Backfill: accounts already paused by PR #4 start their 14-day window NOW (not at created_at),
-- so nobody is deleted before they have had a chance to see the new parent-email form.
update public.user_profiles
   set paused_at = now()
 where age_verified = false and paused_at is null;
