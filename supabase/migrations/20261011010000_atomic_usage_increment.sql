-- Atomic Free-plan daily usage increment. Returns the new count, or NULL when the
-- user is already at p_limit (nothing is incremented in that case).
-- Called by /api/chat with the service role. Apply BEFORE deploying the code that uses it.
create or replace function public.increment_usage(p_user_id uuid, p_day date, p_limit int)
returns int
language sql
security definer
set search_path = public
as $$
  insert into public.usage as u (user_id, day, count)
  values (p_user_id, p_day, 1)
  on conflict (user_id, day)
    do update set count = u.count + 1
    where u.count < p_limit
  returning u.count;
$$;

revoke all on function public.increment_usage(uuid, date, int) from public, anon, authenticated;
grant execute on function public.increment_usage(uuid, date, int) to service_role;
