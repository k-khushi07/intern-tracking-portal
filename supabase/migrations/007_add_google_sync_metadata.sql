-- Google manual sync metadata for report links
-- Safe to run multiple times.

alter table public.report_links
  add column if not exists last_synced_from_google_at timestamptz,
  add column if not exists last_synced_to_google_at timestamptz,
  add column if not exists last_sync_error text;

