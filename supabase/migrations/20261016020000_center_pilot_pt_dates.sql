-- Center pilot dates in America/Los_Angeles: start = PT date of first enrollment; Pro ends at 00:00 PT on start+14.
create or replace function public.enroll_center_seat(p_user uuid, p_slug text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.center_pilots%rowtype; v_seat int; v_used int; v_until timestamptz; v_start date;
begin
  select * into v_p from public.center_pilots where center_slug = p_slug for update;
  if not found or not v_p.active then return jsonb_build_object('status', 'none'); end if;
  select seat_no into v_seat from public.center_seats where user_id = p_user;
  if v_seat is null then
    select count(*) into v_used from public.center_seats where center_slug = p_slug;
    if v_used >= v_p.seat_cap then
      update public.user_profiles set pending_center = null where user_id = p_user;
      return jsonb_build_object('status', 'full');
    end if;
    select coalesce(min(n), 1) into v_seat from generate_series(1, v_p.seat_cap) n
      where not exists (select 1 from public.center_seats s where s.center_slug = p_slug and s.seat_no = n);
    insert into public.center_seats (center_slug, seat_no, user_id) values (p_slug, v_seat, p_user);
    v_used := v_used + 1;
  else
    select count(*) into v_used from public.center_seats where center_slug = p_slug;
  end if;
  -- Pilot starts at the center's first student signup.
  v_start := coalesce(v_p.pilot_start, (now() at time zone 'America/Los_Angeles')::date);
  if v_p.pilot_start is null then update public.center_pilots set pilot_start = v_start where center_slug = p_slug; end if;
  -- Ends at the start of PT day start+14 (= end of the 14th pilot day, Pacific time).
  v_until := (v_start + 14)::timestamp at time zone 'America/Los_Angeles';
  update public.user_profiles
     set comp_reason = 'pilot:' || p_slug,
         comp_pro_until = greatest(coalesce(comp_pro_until, v_until), v_until),
         pending_center = null
   where user_id = p_user;
  return jsonb_build_object('status', 'enrolled', 'seat', v_seat, 'until', v_until, 'filled', v_used >= v_p.seat_cap);
end $$;
revoke all on function public.enroll_center_seat(uuid, text) from public, anon, authenticated;
insert into public.center_pilots (center_slug, seat_cap, active) values ('mathtowne', 10, true), ('irvine_math_academy', 10, true) on conflict (center_slug) do nothing;
