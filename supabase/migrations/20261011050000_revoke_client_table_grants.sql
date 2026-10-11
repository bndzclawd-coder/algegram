-- APPLIED to live Supabase on 2026-10-11 (approved by Basith). Idempotent; safe to re-run.
-- practice_results / practice_usage come from PR #7 (20261011040000); apply that first on fresh databases.
-- Lock down app tables: the app only touches them through the service role or SECURITY DEFINER
-- functions (increment_usage, increment_premium_usage, increment_practice_usage, consume_rate_limit,
-- cleanup_*, handle_new_user). anon/authenticated get no table privileges; service_role is unchanged.
revoke all on table
  public.usage, public.premium_usage, public.rate_limit_buckets, public.subscriptions,
  public.user_profiles, public.user_attribution, public.conversations, public.practice_usage
from anon, authenticated;
-- practice_results: no writes for client roles; SELECT kept for logged-in users (own-row RLS policy).
revoke all on table public.practice_results from anon, authenticated;
grant select on table public.practice_results to authenticated;
