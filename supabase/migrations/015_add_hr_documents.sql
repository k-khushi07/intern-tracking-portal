create table if not exists public.hr_documents (
  key text primary key,
  filename text,
  mime_type text,
  content_base64 text,
  updated_at timestamptz not null default now()
);

