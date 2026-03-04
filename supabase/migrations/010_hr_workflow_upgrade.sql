-- HR workflow upgrade: applications lifecycle, approved interns, status history,
-- and backend-generated intern IDs (EDCS-YYYY-###).

create extension if not exists "pgcrypto";

-- -------------------------------------------------------------------
-- Canonical applications table
-- -------------------------------------------------------------------
create table if not exists public.internship_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_name text,
  email text not null,
  phone text,
  college text,
  cgpa numeric(4,2),
  domain text,
  skills text[] not null default '{}'::text[],
  resume_url text,
  status text not null default 'pending' check (status in ('pending','under_review','approved','rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  hr_notes text,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists internship_applications_status_idx on public.internship_applications(status);
create index if not exists internship_applications_domain_idx on public.internship_applications(domain);
create index if not exists internship_applications_college_idx on public.internship_applications(college);
create index if not exists internship_applications_submitted_idx on public.internship_applications(submitted_at desc);
create index if not exists internship_applications_email_idx on public.internship_applications(email);
create index if not exists internship_applications_name_idx on public.internship_applications(applicant_name);
create index if not exists internship_applications_cgpa_idx on public.internship_applications(cgpa);

alter table public.internship_applications enable row level security;

drop policy if exists "internship_applications_select_authenticated" on public.internship_applications;
create policy "internship_applications_select_authenticated" on public.internship_applications
  for select to authenticated
  using (true);

-- Migrate from legacy intern_applications if available.
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'intern_applications'
  ) then
    insert into public.internship_applications (
      id,
      applicant_name,
      email,
      phone,
      college,
      cgpa,
      domain,
      skills,
      resume_url,
      status,
      submitted_at,
      reviewed_by,
      reviewed_at,
      hr_notes,
      rejection_reason,
      created_at,
      updated_at
    )
    select
      ia.id,
      coalesce(ia.full_name, ia.data ->> 'fullName'),
      coalesce(ia.applicant_email, ia.data ->> 'email', ''),
      ia.data ->> 'phone',
      ia.data ->> 'collegeName',
      nullif(regexp_replace(coalesce(ia.data ->> 'cgpa', ''), '[^0-9\.]', '', 'g'), '')::numeric,
      coalesce(ia.domain, ia.data ->> 'internshipDomain'),
      case
        when coalesce(ia.data ->> 'technicalSkills', '') = '' then '{}'::text[]
        else regexp_split_to_array(ia.data ->> 'technicalSkills', '\s*,\s*')
      end,
      ia.data ->> 'resumeLink',
      case
        when coalesce(ia.status, '') in ('pending','under_review','approved','rejected') then ia.status
        when coalesce(ia.status, '') = '' then 'pending'
        else 'pending'
      end,
      coalesce(ia.created_at, now()),
      ia.reviewed_by,
      ia.reviewed_at,
      null,
      ia.reject_reason,
      coalesce(ia.created_at, now()),
      coalesce(ia.updated_at, now())
    from public.intern_applications ia
    where not exists (
      select 1 from public.internship_applications n where n.id = ia.id
    );
  end if;
exception
  when others then
    -- Keep migration resilient if legacy table shape differs.
    null;
end $$;

-- -------------------------------------------------------------------
-- Approved interns table
-- -------------------------------------------------------------------
create table if not exists public.approved_interns (
  id uuid primary key default gen_random_uuid(),
  intern_id text not null unique,
  application_id uuid not null references public.internship_applications(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  department text not null,
  mentor text not null,
  stipend text,
  status text not null default 'active' check (status in ('active','completed')),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint approved_interns_date_check check (end_date >= start_date)
);

create unique index if not exists approved_interns_application_unique on public.approved_interns(application_id);
create unique index if not exists approved_interns_profile_unique on public.approved_interns(profile_id);
create index if not exists approved_interns_status_idx on public.approved_interns(status);
create index if not exists approved_interns_department_idx on public.approved_interns(department);
create index if not exists approved_interns_mentor_idx on public.approved_interns(mentor);
create index if not exists approved_interns_start_date_idx on public.approved_interns(start_date);

alter table public.approved_interns enable row level security;

drop policy if exists "approved_interns_select_authenticated" on public.approved_interns;
create policy "approved_interns_select_authenticated" on public.approved_interns
  for select to authenticated
  using (true);

-- -------------------------------------------------------------------
-- Application status history for timeline/audit
-- -------------------------------------------------------------------
create table if not exists public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.internship_applications(id) on delete cascade,
  from_status text,
  to_status text not null check (to_status in ('pending','under_review','approved','rejected')),
  changed_by uuid references public.profiles(id),
  reason text,
  changed_at timestamptz not null default now()
);

create index if not exists app_status_history_app_idx on public.application_status_history(application_id, changed_at desc);
create index if not exists app_status_history_status_idx on public.application_status_history(to_status, changed_at desc);

alter table public.application_status_history enable row level security;

drop policy if exists "application_status_history_select_authenticated" on public.application_status_history;
create policy "application_status_history_select_authenticated" on public.application_status_history
  for select to authenticated
  using (true);

-- -------------------------------------------------------------------
-- Backend-safe intern ID generator
-- -------------------------------------------------------------------
create table if not exists public.intern_id_sequences (
  year integer primary key,
  last_number integer not null default 0,
  updated_at timestamptz not null default now()
);

create or replace function public.next_intern_id(p_prefix text default 'EDCS')
returns text
language plpgsql
security definer
as $$
declare
  current_year integer := extract(year from now())::integer;
  next_value integer;
  prefix text := coalesce(nullif(trim(p_prefix), ''), 'EDCS');
begin
  insert into public.intern_id_sequences(year, last_number, updated_at)
  values (current_year, 1, now())
  on conflict (year)
  do update set
    last_number = public.intern_id_sequences.last_number + 1,
    updated_at = now()
  returning last_number into next_value;

  return prefix || '-' || current_year::text || '-' || lpad(next_value::text, 3, '0');
end;
$$;

revoke all on function public.next_intern_id(text) from public;
grant execute on function public.next_intern_id(text) to authenticated;

