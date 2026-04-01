-- Track late weekly report submissions
alter table public.reports
  add column if not exists is_late boolean not null default false;
