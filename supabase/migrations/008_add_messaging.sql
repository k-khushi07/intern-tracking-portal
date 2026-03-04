-- Messaging system (privacy-first, Node-gated)
-- Safe to run multiple times (uses IF NOT EXISTS where possible).

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('direct','group')),
  name text,
  created_by_profile_id uuid references public.profiles(id),
  owner_profile_id uuid references public.profiles(id),
  status text not null default 'active' check (status in ('active','archived')),
  read_only_reason text,
  direct_a uuid references public.profiles(id),
  direct_b uuid references public.profiles(id),
  last_message_at timestamptz,
  last_message_body text,
  last_message_sender_profile_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists conversations_direct_unique
  on public.conversations(direct_a, direct_b)
  where type = 'direct';

create index if not exists conversations_last_message_idx
  on public.conversations(last_message_at desc);

create table if not exists public.conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text,
  can_send boolean not null default true,
  muted_at timestamptz,
  muted_by_profile_id uuid references public.profiles(id),
  muted_reason text,
  unread_count integer not null default 0,
  last_read_at timestamptz,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  is_active boolean not null default true
);

create unique index if not exists conversation_members_unique
  on public.conversation_members(conversation_id, profile_id);

create index if not exists conversation_members_profile_idx
  on public.conversation_members(profile_id, conversation_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_profile_id uuid not null references public.profiles(id),
  body text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by_profile_id uuid references public.profiles(id),
  delete_reason text
);

create index if not exists messages_conversation_created_idx
  on public.messages(conversation_id, created_at desc);

create table if not exists public.message_reports (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  message_id uuid not null references public.messages(id) on delete cascade,
  reported_by_profile_id uuid not null references public.profiles(id),
  reason text,
  status text not null default 'pending' check (status in ('pending','reviewed','resolved')),
  created_at timestamptz not null default now(),
  reviewed_by_profile_id uuid references public.profiles(id),
  reviewed_at timestamptz,
  resolution text
);

create index if not exists message_reports_status_idx
  on public.message_reports(status, created_at desc);

create table if not exists public.hr_investigation_audit (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete set null,
  hr_profile_id uuid not null references public.profiles(id),
  action text not null,
  reason text,
  created_at timestamptz not null default now()
);

-- Defense-in-depth RLS (Node uses service role; client should never hit DB directly)
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_reports enable row level security;
alter table public.hr_investigation_audit enable row level security;

drop policy if exists "conversation_members_select_own" on public.conversation_members;
create policy "conversation_members_select_own" on public.conversation_members
  for select to authenticated
  using (profile_id = auth.uid());

drop policy if exists "messages_select_if_member" on public.messages;
create policy "messages_select_if_member" on public.messages
  for select to authenticated
  using (
    exists (
      select 1
      from public.conversation_members m
      where m.conversation_id = messages.conversation_id
        and m.profile_id = auth.uid()
        and m.is_active = true
    )
  );

