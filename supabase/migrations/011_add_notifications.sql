-- Notifications (user-specific; emitted by Node)
-- Safe to run multiple times.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text,
  type text not null default 'info',
  category text,
  link text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_created_idx
  on public.notifications(recipient_profile_id, created_at desc);

create index if not exists notifications_recipient_unread_idx
  on public.notifications(recipient_profile_id)
  where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select to authenticated
  using (recipient_profile_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update to authenticated
  using (recipient_profile_id = auth.uid());

