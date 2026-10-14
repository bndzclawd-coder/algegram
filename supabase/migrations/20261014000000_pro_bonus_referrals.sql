-- Signup bonus (7 days Pro, no card) + referrals (+7 days per confirmed friend, max 4).
-- Server-only: client roles have no privileges on these tables/functions.
alter table public.user_profiles
  add column if not exists bonus_pro_until  timestamptz,
  add column if not exists signup_bonus_at  timestamptz,  -- set once; the bonus is never granted twice
  add column if not exists referral_code    text,         -- random, no names
  add column if not exists pending_ref_code text,         -- code the user arrived with, awarded on confirmation/consent
  add column if not exists signup_ip_hash   text;         -- salted SHA-256 prefix, only for self-referral checks

create unique index if not exists user_profiles_referral_code_key on public.user_profiles (referral_code) where referral_code is not null;

create table if not exists public.referrals (
  referred_user_id uuid primary key references auth.users(id) on delete cascade,
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  ip_hash          text,
  rewarded         boolean not null default false,
  reason           text,          -- 'rewarded' | 'self' | 'same_ip' | 'cap' | 'referrer_child'
  created_at       timestamptz not null default now()
);
create index if not exists referrals_referrer_idx on public.referrals (referrer_user_id);
alter table public.referrals enable row level security;
revoke all on table public.referrals from public, anon, authenticated;
revoke all on table public.user_profiles from public, anon, authenticated;

-- Grant the one-time signup bonus. No-op if already granted or the account is on a center pilot.
create or replace function public.grant_signup_bonus(p_user_id uuid, p_days int default 7)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare v_until timestamptz;
begin
  update public.user_profiles
     set bonus_pro_until = greatest(coalesce(bonus_pro_until, now()), now()) + make_interval(days => p_days),
         signup_bonus_at = now()
   where user_id = p_user_id
     and signup_bonus_at is null
     and (comp_reason is null or comp_reason not ilike 'pilot%')
  returning bonus_pro_until into v_until;
  return v_until;
end $$;

-- Credit the referrer of a newly confirmed account. Returns the outcome label.
create or replace function public.award_referral(p_referred uuid, p_code text, p_ip_hash text)
returns text language plpgsql security definer set search_path = public as $$
declare r public.user_profiles%rowtype; v_reason text; v_count int;
begin
  if p_code is null or p_code = '' then return 'no_code'; end if;
  select * into r from public.user_profiles where referral_code = lower(p_code) for update;
  if not found then return 'no_code'; end if;
  if exists (select 1 from public.referrals where referred_user_id = p_referred) then return 'duplicate'; end if;

  select count(*) into v_count from public.referrals where referrer_user_id = r.user_id and rewarded;
  v_reason := case
    when r.user_id = p_referred then 'self'
    when r.parental_consent is true or (r.birth_year is not null and extract(year from now())::int - r.birth_year < 13) then 'referrer_child'
    when p_ip_hash is not null and (p_ip_hash = r.signup_ip_hash or exists (
           select 1 from public.referrals where referrer_user_id = r.user_id and ip_hash = p_ip_hash and created_at > now() - interval '30 days')) then 'same_ip'
    when v_count >= 4 then 'cap'
    else 'rewarded' end;

  if v_reason = 'self' then return v_reason; end if;  -- nothing to record
  insert into public.referrals (referred_user_id, referrer_user_id, ip_hash, rewarded, reason)
  values (p_referred, r.user_id, p_ip_hash, v_reason = 'rewarded', v_reason);
  if v_reason = 'rewarded' then
    update public.user_profiles
       set bonus_pro_until = greatest(coalesce(bonus_pro_until, now()), now()) + interval '7 days'
     where user_id = r.user_id;
  end if;
  return v_reason;
end $$;

revoke all on function public.grant_signup_bonus(uuid, int) from public, anon, authenticated;
revoke all on function public.award_referral(uuid, text, text) from public, anon, authenticated;
grant execute on function public.grant_signup_bonus(uuid, int) to service_role;
grant execute on function public.award_referral(uuid, text, text) to service_role;
