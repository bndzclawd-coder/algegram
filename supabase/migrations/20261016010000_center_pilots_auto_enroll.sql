-- Automatic center-link enrollment. Only centers with a center_pilots row get it; unknown slugs = attribution only.
-- Privacy: slug, start date, active flag, seat cap. No names or contact details.
create table if not exists public.center_pilots (
  center_slug text primary key check (center_slug ~ '^[a-z0-9_]{1,40}$'),
  pilot_start date,            -- set atomically at the center's first student enrollment
  full_alert_sent_at timestamptz, -- one internal 'center is full' alert per center
  active      boolean not null default true,
  seat_cap    int not null default 10 check (seat_cap between 1 and 500),
  created_at  timestamptz not null default now()
);
alter table public.center_pilots enable row level security;
revoke all on public.center_pilots from public, anon, authenticated;

-- Center carried from the signed center-link cookie at signup (or the signed consent token), applied at activation.
alter table public.user_profiles add column if not exists pending_center text check (pending_center is null or pending_center ~ '^[a-z0-9_]{1,40}$');

-- 'open' | 'full' | 'none' (no active pilot record)
create or replace function public.center_seat_status(p_slug text)
returns text language sql stable security definer set search_path = public as $$
  select case
    when p.center_slug is null or not p.active then 'none'
    when (select count(*) from public.center_seats s where s.center_slug = p.center_slug) >= p.seat_cap then 'full'
    else 'open' end
  from (select 1) x left join public.center_pilots p on p.center_slug = p_slug
$$;

-- Atomic enrollment: row lock on the pilot serializes concurrent signups, so the cap can't be exceeded.
-- Pilot start = first enrollment; every seat gets pilot Pro until start + 14 days. Full => no tag, no seat.
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
  v_start := coalesce(v_p.pilot_start, current_date);
  if v_p.pilot_start is null then update public.center_pilots set pilot_start = v_start where center_slug = p_slug; end if;
  v_until := (v_start + 14)::timestamptz;
  update public.user_profiles
     set comp_reason = 'pilot:' || p_slug,
         comp_pro_until = greatest(coalesce(comp_pro_until, v_until), v_until),
         pending_center = null
   where user_id = p_user;
  return jsonb_build_object('status', 'enrolled', 'seat', v_seat, 'until', v_until, 'filled', v_used >= v_p.seat_cap);
end $$;
-- Claims the one-time "center is full" alert (returns true once per center).
create or replace function public.claim_center_full_alert(p_slug text)
returns boolean language sql security definer set search_path = public as $$
  with u as (update public.center_pilots set full_alert_sent_at = now() where center_slug = p_slug and full_alert_sent_at is null returning 1)
  select exists (select 1 from u)
$$;
revoke all on function public.claim_center_full_alert(text) from public, anon, authenticated;
revoke all on function public.center_seat_status(text) from public, anon, authenticated;
revoke all on function public.enroll_center_seat(uuid, text) from public, anon, authenticated;
