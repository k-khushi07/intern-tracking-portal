alter table public.profiles
  add column if not exists profile_data jsonb not null default '{}'::jsonb;

