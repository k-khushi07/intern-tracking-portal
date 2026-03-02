-- Daily logs + reports tables (Supabase/Postgres)

create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  intern_profile_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null,
  hours_worked integer not null default 0,
  tasks text not null default '',
  learnings text not null default '',
  blockers text not null default '',
  tasks_completed integer not null default 1,
  status text not null default 'submitted' check (status in ('submitted','approved','rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists daily_logs_intern_idx on public.daily_logs(intern_profile_id);
create index if not exists daily_logs_date_idx on public.daily_logs(log_date);
create index if not exists daily_logs_status_idx on public.daily_logs(status);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  intern_profile_id uuid not null references public.profiles(id) on delete cascade,
  pm_profile_id uuid references public.profiles(id),
  report_type text not null check (report_type in ('weekly','monthly')),
  week_number integer,
  month text,
  period_start date,
  period_end date,
  total_hours integer not null default 0,
  days_worked integer not null default 0,
  summary text not null default '',
  data jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reports_intern_idx on public.reports(intern_profile_id);
create index if not exists reports_pm_idx on public.reports(pm_profile_id);
create index if not exists reports_status_idx on public.reports(status);
create index if not exists reports_type_idx on public.reports(report_type);

-- Lock down tables by default (Node uses service role for DB access)
alter table public.daily_logs enable row level security;
alter table public.reports enable row level security;

drop policy if exists "daily_logs_select_own" on public.daily_logs;
create policy "daily_logs_select_own" on public.daily_logs
  for select to authenticated
  using (intern_profile_id = auth.uid());

drop policy if exists "reports_select_own" on public.reports;
create policy "reports_select_own" on public.reports
  for select to authenticated
  using (intern_profile_id = auth.uid());

