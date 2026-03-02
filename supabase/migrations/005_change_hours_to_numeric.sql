-- Allow fractional hours in logs/reports (e.g. 7.5 hours)

alter table public.daily_logs
  alter column hours_worked type numeric(6,2) using hours_worked::numeric;

alter table public.daily_logs
  alter column hours_worked set default 0;

alter table public.reports
  alter column total_hours type numeric(8,2) using total_hours::numeric;

alter table public.reports
  alter column total_hours set default 0;

