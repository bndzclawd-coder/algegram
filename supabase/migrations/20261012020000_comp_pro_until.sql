-- NOT YET APPLIED to live Supabase. Apply only with Basith's approval. Idempotent; safe to re-run.
-- Comp (free) Pro with an automatic end date, for pilot / test accounts.
-- Lives on user_profiles, which the Stripe webhook never writes, so Stripe events cannot clear it.
-- A user is Pro if (paid Pro: subscriptions.plan='pro' and status active/trialing) OR comp_pro_until > now().
alter table public.user_profiles
  add column if not exists comp_pro_until timestamptz,
  add column if not exists comp_reason    text;   -- short label only, e.g. 'pilot:center-a'. No names/emails/PII.

alter table public.user_profiles drop constraint if exists user_profiles_comp_reason_len;
alter table public.user_profiles
  add constraint user_profiles_comp_reason_len check (comp_reason is null or char_length(comp_reason) <= 64);

-- Same lockdown as 20261011050000: client roles get no table privileges; only service_role writes.
alter table public.user_profiles enable row level security;
revoke all on table public.user_profiles from public, anon, authenticated;

-- Server-only helper: grant (or extend) comp Pro for N days from now. Callable by service_role only.
create or replace function public.grant_comp_pro(p_user_id uuid, p_days int, p_reason text default null)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare v_until timestamptz;
begin
  if p_days is null or p_days < 1 or p_days > 366 then
    raise exception 'p_days must be between 1 and 366';
  end if;
  update public.user_profiles
     set comp_pro_until = now() + make_interval(days => p_days),
         comp_reason    = left(p_reason, 64)
   where user_id = p_user_id
  returning comp_pro_until into v_until;
  if v_until is null then
    raise exception 'no user_profiles row for %, user must finish signup/age check first', p_user_id;
  end if;
  return v_until;
end $$;

revoke all on function public.grant_comp_pro(uuid, int, text) from public, anon, authenticated;
grant execute on function public.grant_comp_pro(uuid, int, text) to service_role;
