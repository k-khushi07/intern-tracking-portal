-- Announcements visible to PMs/Interns (created by HR/Admin)

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  created_by_profile_id uuid not null references public.profiles(id),
  title text not null,
  content text not null,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  audience_roles text[] not null default array['intern','pm']::text[],
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists announcements_created_at_idx on public.announcements(created_at desc);
create index if not exists announcements_audience_roles_idx on public.announcements using gin(audience_roles);

alter table public.announcements enable row level security;

drop policy if exists "announcements_select_all_authenticated" on public.announcements;
create policy "announcements_select_all_authenticated" on public.announcements
  for select to authenticated
  using (true);

