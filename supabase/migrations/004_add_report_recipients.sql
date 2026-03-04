-- Add recipient targeting for reports (PM/HR)
-- Existing behavior: reports go to PM only. We preserve that as the default.

alter table public.reports
  add column if not exists recipient_roles text[] not null default array['pm']::text[];

create index if not exists reports_recipient_roles_gin_idx
  on public.reports
  using gin (recipient_roles);

