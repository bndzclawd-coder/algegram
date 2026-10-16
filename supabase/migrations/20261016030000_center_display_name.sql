-- Center display name for the signup banner ("Joining through <center>"). Business name only, no student data.
alter table public.center_pilots add column if not exists display_name text check (display_name is null or length(display_name) <= 80);
update public.center_pilots set display_name = 'MathTowne' where center_slug = 'mathtowne' and display_name is null;
update public.center_pilots set display_name = 'Irvine Math Academy' where center_slug = 'irvine_math_academy' and display_name is null;
