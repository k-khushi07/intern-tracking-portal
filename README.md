# Intern Tracking Portal

## Setup

### 1) Create Supabase tables
- Run `supabase/schema.sql` in the Supabase SQL editor.

### 1.1) Create the first admin
- Option A (recommended): run `node backend/scripts/bootstrap-admin.js <email> <password> [full name]`
- Option B: create an Auth user in Supabase, then insert a row into `public.profiles` with:
  - `id = auth.users.id`, `role = 'admin'`, plus `email`, `full_name`

### 1.2) If you already ran the schema earlier
- Run `supabase/migrations/001_add_profile_data.sql` in Supabase SQL editor.
- Run `supabase/migrations/002_add_logs_reports.sql` in Supabase SQL editor.
- Run `supabase/migrations/003_add_announcements.sql` in Supabase SQL editor.
- Run `supabase/migrations/004_add_report_recipients.sql` in Supabase SQL editor.
- Run `supabase/migrations/005_change_hours_to_numeric.sql` in Supabase SQL editor.
- Run `supabase/migrations/006_add_tna_blueprint_links.sql` in Supabase SQL editor.
- Run `supabase/migrations/007_add_google_sync_metadata.sql` in Supabase SQL editor.
- Run `supabase/migrations/007_add_report_links_sync_metadata.sql` in Supabase SQL editor.
- Run `supabase/migrations/008_add_messaging.sql` in Supabase SQL editor.
- Run `supabase/migrations/009_add_message_rpc.sql` in Supabase SQL editor.
- Run `supabase/migrations/010_hr_workflow_upgrade.sql` in Supabase SQL editor.

### 1.3) If you still see table/cache mismatch errors
- Confirm `public.internship_applications` exists (the backend expects this table first).
- If Supabase returns "schema cache" errors after creating tables, run:
  - `NOTIFY pgrst, 'reload schema';`

### 2) Backend env
- Copy `backend/.env.example` → `backend/.env` and fill:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `EMAIL_USER` / `EMAIL_PASS`

### Google manual sync (Plan A / no credentials)
- TNA + Blueprint can be pulled into the portal with "Sync from Google" **only if** the Sheet/Doc link is public:
  - Share as "Anyone with the link can view", or
  - Use "Publish to web"
- "Sync to Google" (writing back) requires credentials and is not supported in Plan A.

### 3) Run dev servers
- Backend: `cd backend` then `npm run dev` (runs `backend/api-server.js`)
- Frontend: `cd frontend` then `npm run dev`

The frontend proxies `/api/*` to the backend via `frontend/vite.config.js`.

### 3.1) Separated panel routes
- Intern panel:
  - Login: `http://localhost:5173/intern/login`
  - Dashboard: `http://localhost:5173/intern/dashboard`
- HR panel:
  - Login: `http://localhost:5173/hr/login`
  - Dashboard: `http://localhost:5173/hr/dashboard`
- PM panel:
  - Login: `http://localhost:5173/pm/login`
  - Dashboard: `http://localhost:5173/pm/dashboard`
- Admin panel:
  - Login: `http://localhost:5173/admin/login`
  - Dashboard: `http://localhost:5173/admin/dashboard`

Legacy routes like `/dashboard/intern` still work and now redirect to the separated panel paths.

### 4) Quick health checks
- Node running: `GET /api/health`
- Supabase reachable + schema present: `GET /api/health/supabase`

## Core flows implemented
- Application submit: `POST /api/applications` (from the Apply page)
- Login (cookie session): `POST /api/auth/login`
- HR dashboard data: `GET /api/hr/users`
- HR approval: `POST /api/hr/applications/:id/approve`
- Email sending: `POST /api/send-email` (HR/PM/Admin only)
- Intern daily logs: `GET/POST /api/intern/daily-logs`
- Intern weekly/monthly reports: `GET/POST /api/intern/reports`
- PM review reports: `GET /api/pm/reports`, `PATCH /api/pm/reports/:id/review`
