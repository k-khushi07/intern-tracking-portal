create table if not exists public.hr_templates (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  content text,
  custom_pdf text,
  is_custom boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hr_templates_owner_idx on public.hr_templates(owner_profile_id);
