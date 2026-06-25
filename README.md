# ICTF — ICT Foundation · Student Learning Portal

Premium digital learning platform powered by **Supabase** (PostgreSQL + RLS) and **Next.js**.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, TypeScript, Tailwind, shadcn/ui |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (SSR cookies) |
| Security | Row Level Security on all tables, role in `profiles` (not user_metadata) |
| Storage | Supabase Storage with signed URLs |
| Hosting | Vercel |

## Quick Start

```bash
npm install
cp .env.example .env.local   # Add Supabase keys
npm run dev
```

### Apply database migrations

**Option A — Supabase CLI (recommended)**

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF   # from dashboard URL
npx supabase db push
```

**Option B — SQL Editor**

```bash
bash scripts/combine-migrations.sh
```

Open `supabase/all-migrations-combined.sql` in **Supabase Dashboard → SQL Editor** and run it.

**Option C — Direct psql**

```bash
# Set SUPABASE_DB_PASSWORD in .env.local
bash scripts/supabase-bootstrap.sh
```

> Do not use `supabase/apply-all.sql` alone — it is outdated. Use files in `supabase/migrations/` in order.

Migration files (in order):

1. `20240624120000_initial_schema.sql` — core LMS tables + RLS + `handle_new_user`
2. `20240624120001_storage_policies.sql` — private `resources` bucket
3. `20240624120002_seed_reference_data.sql` — courses, FAQs, site stats, badges
4. `20240625120000_remove_attendance.sql` — remove attendance feature
5. `20240625120001_home_cms.sql` — home page CMS tables + seed
6. `20240625120002_calendar.sql` — calendar categories + sessions
7. `20240625120005_admin_storage_bucket.sql` — public `admin` bucket for CMS images
8. `20240625120003_bilingual_home.sql` — Tamil columns on home CMS
9. `20240625120004_paper_center_map_coords.sql` — map pin coordinates
10. `20240625120006_backend_hardening.sql` — student auto-provision trigger, `companies.description_ta`

### Verify connection

```bash
npx tsx scripts/verify-supabase-connection.ts
```

### First admin user

1. Register a student account, or create a user in Supabase Auth dashboard
2. Run [`scripts/promote-admin.sql`](scripts/promote-admin.sql) in SQL Editor (set your email)
3. Log in and use **Admin → Home** to manage marketing content

After migrations, student **Apply Now** creates `auth.users` + `profiles` + `students` rows (requires `SUPABASE_SERVICE_ROLE_KEY`).

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # Required for registration — server only, never NEXT_PUBLIC_
# SUPABASE_DB_PASSWORD=      # Optional — for scripts/supabase-bootstrap.sh
```

All three Supabase keys (URL, anon, service role) are required for real registration. With only URL + anon, the app runs in partial mode and **Apply Now** shows a configuration warning.

## Security Architecture

- **RLS enabled** on every public table
- **Roles stored in `profiles.role`** — never authorize via `user_metadata`
- **Registration** uses server action with service role to set `app_metadata.role`
- **Middleware** refreshes Supabase session on every request
- **Admin mutations** go through server actions with staff/admin checks
- **Resources** served via short-lived signed URLs (300s TTL)

## Demo Mode

Without Supabase env vars, the app falls back to in-memory demo data for local UI testing.

| Role | Email | Password |
|------|-------|----------|
| Student | student@demo.ictf.lk | demo1234 |
| Parent | parent@demo.ictf.lk | demo1234 |
| Admin | admin@demo.ictf.lk | demo1234 |

## Scripts

- `npm run dev` — Development
- `npm run build` — Production build
- `npm run seed` — Demo account info
