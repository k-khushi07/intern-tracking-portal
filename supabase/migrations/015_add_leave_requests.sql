-- Add intern leave request workflow

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  intern_profile_id uuid not null references public.profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  requested_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index if not exists leave_requests_intern_idx on public.leave_requests(intern_profile_id);
create index if not exists leave_requests_status_idx on public.leave_requests(status);
create index if not exists leave_requests_requested_at_idx on public.leave_requests(requested_at desc);

alter table public.leave_requests enable row level security;

drop policy if exists "leave_requests_select_own" on public.leave_requests;
create policy "leave_requests_select_own" on public.leave_requests
  for select to authenticated
  using (intern_profile_id = auth.uid());

drop policy if exists "leave_requests_insert_own" on public.leave_requests;
create policy "leave_requests_insert_own" on public.leave_requests
  for insert to authenticated
  with check (intern_profile_id = auth.uid());

drop policy if exists "leave_requests_update_own" on public.leave_requests;
create policy "leave_requests_update_own" on public.leave_requests
  for update to authenticated
  using (intern_profile_id = auth.uid())
  with check (intern_profile_id = auth.uid());

