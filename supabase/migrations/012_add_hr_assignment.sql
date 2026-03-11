-- Add HR assignment for interns (similar to pm_id)
alter table public.profiles
  add column if not exists hr_id uuid references public.profiles(id);

create index if not exists profiles_hr_id_idx on public.profiles(hr_id);

