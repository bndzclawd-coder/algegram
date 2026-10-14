-- Signups by first-touch source / campaign for a date range (America/Los_Angeles days, inclusive).
-- Excludes internal test accounts (support+...@algegram.xyz). Accounts with no attribution row
-- are reported as (direct). Run in the Supabase SQL editor, or via scripts/signup-report.mjs.
-- Edit the two dates below.
with params as (
  select date '2026-10-01' as from_day, date '2026-10-31' as to_day
),
signups as (
  select u.id,
         (u.created_at at time zone 'America/Los_Angeles')::date as day,
         u.email_confirmed_at is not null as confirmed,
         a.signup_attribution as attr
  from auth.users u
  left join public.user_attribution a on a.user_id = u.id
  cross join params p
  where (u.created_at at time zone 'America/Los_Angeles')::date between p.from_day and p.to_day
    and u.email not ilike 'support+%@algegram.xyz'
)
select coalesce(attr->>'ref', attr->>'utm_source', '(direct)') as source,
       coalesce(attr->>'utm_medium', '')                        as medium,
       coalesce(attr->>'utm_campaign', attr->>'referrer_domain', '') as campaign_or_referrer,
       coalesce(attr->>'utm_content', '')                       as content,
       count(*)                                                 as signups,
       count(*) filter (where confirmed)                        as confirmed
from signups
group by 1, 2, 3, 4
order by signups desc, source;
