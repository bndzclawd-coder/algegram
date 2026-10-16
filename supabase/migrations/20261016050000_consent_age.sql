-- Country-based parental consent age (13 to 16). Only the resulting age is stored, never the IP or country.
alter table public.user_profiles add column if not exists consent_age smallint check (consent_age is null or consent_age between 13 and 16);
