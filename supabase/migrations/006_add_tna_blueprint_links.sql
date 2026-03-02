-- Structured TNA + Blueprint + optional external links
-- Frontend never talks to Supabase directly; Node uses service role.

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

create index if not exists tna_items_intern_idx on public.tna_items(intern_profile_id);
create index if not exists tna_items_week_idx on public.tna_items(intern_profile_id, week_number);

create table if not exists public.intern_blueprints (
  id uuid primary key default gen_random_uuid(),
  intern_profile_id uuid not null unique references public.profiles(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists intern_blueprints_intern_idx on public.intern_blueprints(intern_profile_id);

create table if not exists public.report_links (
  id uuid primary key default gen_random_uuid(),
  intern_profile_id uuid not null unique references public.profiles(id) on delete cascade,
  tna_sheet_url text,
  blueprint_doc_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists report_links_intern_idx on public.report_links(intern_profile_id);

-- RLS (defense-in-depth; backend uses service role)
alter table public.tna_items enable row level security;
alter table public.intern_blueprints enable row level security;
alter table public.report_links enable row level security;

drop policy if exists "tna_select_own" on public.tna_items;
create policy "tna_select_own" on public.tna_items
  for select to authenticated
  using (intern_profile_id = auth.uid());

drop policy if exists "blueprint_select_own" on public.intern_blueprints;
create policy "blueprint_select_own" on public.intern_blueprints
  for select to authenticated
  using (intern_profile_id = auth.uid());

drop policy if exists "report_links_select_own" on public.report_links;
create policy "report_links_select_own" on public.report_links
  for select to authenticated
  using (intern_profile_id = auth.uid());

