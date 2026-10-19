-- Aggregate count of guest chats started on /ask, per Pacific day. Date + number only.
create table if not exists public.guest_ask_daily (
  day date primary key,
  starts int not null default 0
);
alter table public.guest_ask_daily enable row level security;
revoke all on public.guest_ask_daily from public, anon, authenticated;

create or replace function public.increment_guest_ask(p_day date)
returns int
language sql
security definer
set search_path = public
as $$
  insert into public.guest_ask_daily as g (day, starts) values (p_day, 1)
  on conflict (day) do update set starts = g.starts + 1
  returning g.starts;
$$;
revoke all on function public.increment_guest_ask(date) from public, anon, authenticated;
grant execute on function public.increment_guest_ask(date) to service_role;
