alter table public.profiles
  add column if not exists access_start_date date null,
  add column if not exists access_end_date date null;

create index if not exists idx_profiles_access_window
  on public.profiles(access_start_date, access_end_date);
