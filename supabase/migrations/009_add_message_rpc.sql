-- RPC helpers for messaging (atomic updates)
-- Safe to run multiple times.

create or replace function public.msg_increment_unread(p_conversation_id uuid, p_sender_id uuid)
returns void
language sql
security definer
as $$
  update public.conversation_members
  set unread_count = unread_count + 1
  where conversation_id = p_conversation_id
    and profile_id <> p_sender_id
    and is_active = true;
$$;

create or replace function public.msg_mark_read(p_conversation_id uuid, p_profile_id uuid, p_read_at timestamptz)
returns void
language sql
security definer
as $$
  update public.conversation_members
  set unread_count = 0,
      last_read_at = p_read_at
  where conversation_id = p_conversation_id
    and profile_id = p_profile_id
    and is_active = true;
$$;

