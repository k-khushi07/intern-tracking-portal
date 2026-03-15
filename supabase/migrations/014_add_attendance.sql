-- Add intern attendance tracking

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  intern_profile_id uuid not null references public.profiles(id) on delete cascade,
  attendance_date date not null,
  status text not null default 'present' check (status in ('present','absent','leave','half_day','remote')),
  check_in time,
  check_out time,
  notes text not null default '',
  marked_by uuid references public.profiles(id),
  marked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (intern_profile_id, attendance_date)
);

create index if not exists attendance_intern_idx on public.attendance(intern_profile_id);
create index if not exists attendance_date_idx on public.attendance(attendance_date);
create index if not exists attendance_status_idx on public.attendance(status);

alter table public.attendance enable row level security;

drop policy if exists "attendance_select_own" on public.attendance;
create policy "attendance_select_own" on public.attendance
  for select to authenticated
  using (intern_profile_id = auth.uid());

