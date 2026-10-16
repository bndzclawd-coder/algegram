-- Current paying customers (Stripe active/trialing, as mirrored into public.subscriptions by the
-- webhook) by first-touch source. Excludes support+ test accounts. Comp/bonus/pilot Pro is NOT paid.
select coalesce(a.signup_attribution->>'ref', a.signup_attribution->>'utm_source', '(direct)') as source,
       coalesce(a.signup_attribution->>'utm_campaign', a.signup_attribution->>'referrer_domain', '') as campaign_or_referrer,
       count(*) filter (where s.status = 'active')   as active,
       count(*) filter (where s.status = 'trialing') as trialing,
       count(*)                                      as total
from public.subscriptions s
join auth.users u on u.id = s.user_id
left join public.user_attribution a on a.user_id = s.user_id
where s.plan = 'pro' and s.status in ('active', 'trialing') and s.stripe_subscription_id is not null
  and u.email not ilike 'support+%@algegram.xyz'
group by 1, 2
order by total desc, source;
