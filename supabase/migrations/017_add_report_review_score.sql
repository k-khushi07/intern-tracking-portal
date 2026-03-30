-- Add optional review score for report feedback

alter table public.reports
  add column if not exists review_score integer;

alter table public.reports
  drop constraint if exists reports_review_score_check;

alter table public.reports
  add constraint reports_review_score_check
  check (review_score is null or (review_score >= 0 and review_score <= 100));

