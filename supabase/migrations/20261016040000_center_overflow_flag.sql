-- Overflow students (center link, seats full): remember the center slug so the app can say
-- "Your center's seats are full. Ask your teacher." after sign-in. Slug only, no seat, no center tag.
alter table public.user_profiles add column if not exists center_overflow text check (center_overflow is null or center_overflow ~ '^[a-z0-9_]{1,40}$');
create or replace function public.mark_center_overflow(p_user uuid, p_slug text)
returns void language sql security definer set search_path = public as $$
  update public.user_profiles set center_overflow = p_slug where user_id = p_user
    and not exists (select 1 from public.center_seats where user_id = p_user)
$$;
revoke all on function public.mark_center_overflow(uuid, text) from public, anon, authenticated;
