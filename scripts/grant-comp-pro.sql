-- Run in the Supabase SQL editor (runs as postgres / service role). Never from the browser.
-- Grant a pilot account free Pro for 14 (or 30) days. Ends automatically; Stripe can't override it.
select public.grant_comp_pro('00000000-0000-0000-0000-000000000000'::uuid, 14, 'pilot:center-name');

-- Check:
-- select user_id, comp_pro_until, comp_reason from public.user_profiles where comp_pro_until is not null;
-- Revoke early:
-- update public.user_profiles set comp_pro_until = null, comp_reason = null where user_id = '...';
