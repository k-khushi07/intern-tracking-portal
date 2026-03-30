-- Intern-facing documents (offer letter, certificates, submissions, etc.)

create table if not exists public.intern_documents (
  id uuid primary key default gen_random_uuid(),
  intern_profile_id uuid not null references public.profiles(id) on delete cascade,
  document_type text not null check (document_type in ('offer_letter','certificate','submission','other')),
  title text not null default '',
  filename text,
  mime_type text,
  -- file_path can be a storage object path (e.g. "intern-docs/<id>/offer-letter.pdf")
  -- or an absolute URL. file_url can store a resolved public URL when available.
  file_path text,
  file_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists intern_documents_intern_idx on public.intern_documents(intern_profile_id);
create index if not exists intern_documents_type_idx on public.intern_documents(document_type);
create index if not exists intern_documents_updated_at_idx on public.intern_documents(updated_at desc);

alter table public.intern_documents enable row level security;

drop policy if exists "intern_documents_select_own" on public.intern_documents;
create policy "intern_documents_select_own" on public.intern_documents
  for select to authenticated
  using (intern_profile_id = auth.uid());

