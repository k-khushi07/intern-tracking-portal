-- Add department targeting for announcements

alter table public.announcements
  add column if not exists department text;

create index if not exists announcements_department_idx on public.announcements(department);

