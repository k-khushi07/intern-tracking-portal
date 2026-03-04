-- Minimal schema for Intern Tracking Portal (Supabase/Postgres)
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null check (role in ('admin','hr','pm','intern')),
  status text not null default 'active',
  pm_code text unique,
  intern_id text unique,
  pm_id uuid references public.profiles(id),
  profile_completed boolean not null default false,
  profile_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_pm_id_idx on public.profiles(pm_id);

create table if not exists public.intern_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_email text not null,
  full_name text,
  domain text,
  status text not null default '',
  data jsonb not null default '{}'::jsonb,
  reject_reason text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists intern_applications_status_idx on public.intern_applications(status);
create index if not exists intern_applications_email_idx on public.intern_applications(applicant_email);

-- Optional RLS starter policies (Node still enforces roles)
alter table public.profiles enable row level security;
alter table public.intern_applications enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = auth.uid());

-- ====================
-- Daily logs + reports
-- ====================

create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  intern_profile_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null,
  hours_worked numeric(6,2) not null default 0,
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
  recipient_roles text[] not null default array['pm']::text[],
  report_type text not null check (report_type in ('weekly','monthly')),
  week_number integer,
  month text,
  period_start date,
  period_end date,
  total_hours numeric(8,2) not null default 0,
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

-- Structured TNA + Blueprint + optional external links
create table if not exists public.tna_items (
  id uuid primary key default gen_random_uuid(),
  intern_profile_id uuid not null references public.profiles(id) on delete cascade,
  week_number integer,
  task text not null default '',
  planned_date date,
  plan_of_action text not null default '',
  executed_date date,
  status text not null default 'pending' check (status in ('pending','in_progress','completed','blocked')),
  reason text,
  deliverable text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.intern_blueprints (
  id uuid primary key default gen_random_uuid(),
  intern_profile_id uuid not null unique references public.profiles(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_links (
  id uuid primary key default gen_random_uuid(),
  intern_profile_id uuid not null unique references public.profiles(id) on delete cascade,
  tna_sheet_url text,
  blueprint_doc_url text,
  last_synced_from_google_at timestamptz,
  last_synced_to_google_at timestamptz,
  last_sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reports_intern_idx on public.reports(intern_profile_id);
create index if not exists reports_pm_idx on public.reports(pm_profile_id);
create index if not exists reports_status_idx on public.reports(status);
create index if not exists reports_type_idx on public.reports(report_type);

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

-- ====================
-- Announcements
-- ====================

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
