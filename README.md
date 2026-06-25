# ICTF — ICT Foundation · Student Learning Portal

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20RLS-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer%20Motion-12-0055FF?style=flat-square&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

Premium digital learning platform for **ICT Foundation (Pvt) Ltd** — marketing site, student LMS, parent portal, and admin CMS. Built with **Next.js 16**, **Supabase** (PostgreSQL + Row Level Security), and **Vercel**.

**Live:** [ictf.lk](https://ictf.lk) · **Repo:** [github.com/RavirajSarangan/vithuictf](https://github.com/RavirajSarangan/vithuictf)

---

## Overview

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| Animation | Framer Motion, CSS keyframes, `tw-animate-css` |
| Database | Supabase PostgreSQL with RLS on every table |
| Auth | Supabase Auth (SSR cookies), roles in `profiles` |
| Storage | Supabase Storage — private `resources` bucket + public `admin` CMS bucket |
| Email | Resend (transactional) |
| Payments | Stripe (webhook-ready) |
| Hosting | Vercel + Analytics + Speed Insights |
| i18n | English, Sinhala (`/si`), Tamil (`/ta`) marketing routes |

---

## Features

### Marketing site
- Hero with founder photo, ICT-themed decor, trust marquee, and program chips
- Programs showcase (O/L ICT, A/L ICT, Online Zoom, etc.)
- Island-wide paper center map with district SEO pages
- Results & rankings, success stories, FAQ (CMS-driven)
- Contact inquiry form with admin inbox + email confirmation
- Bilingual home CMS (English + Tamil columns)
- Coming-soon gates for parent, teacher, admin, and payments portals
- SEO: sitemap, robots, JSON-LD, Open Graph, locale alternates, llms.txt

### Student portal
- Dashboard, calendar, resources (signed URLs), results & charts
- Achievements & gamification badges, leaderboard, study streak, points
- Profile flip-card (shareable public card at `/card/[studentId]`)
- Onboarding wizard, settings, AI assistant
- Certificate verification at `/verify/[code]`

### Parent portal
- Linked student performance, calendar, notifications
- PDF report generation via `@react-pdf/renderer`

### Admin portal
- Dashboard, analytics (Recharts), students/teachers/parents CRUD
- Home CMS, courses catalog, resources, calendar, certificates
- Contact inquiries, payments settings, platform settings, audit log
- Marketing visibility & coming-soon toggles

---

## Badges

### Security & compliance (UI)

Displayed on login, marketing footer, and portal layouts via `SecurityComplianceBadges`:

| Badge | Asset | Where shown |
|-------|-------|-------------|
| **PDPA Compliance** | `public/compliance/icons/pdpa.svg` | Login strip, marketing |
| **ISO 27001 Certified** | `public/compliance/icons/iso-27001.svg` | Login strip, marketing |
| **PCI DSS Certified** | `public/compliance/icons/pci-dss.svg` | Login strip, marketing |
| Portal seal variants | `public/compliance/*-badge.svg` | Student/parent/admin footers |

Optional secure-connection line: *"Secure 256-bit SSL encryption"* with lock icon.

### Student achievement badges (database)

Seeded in `badge_definitions` — unlocked per student in `student_achievements`:

| ID | Title | Criteria | Icon | Points |
|----|-------|----------|------|--------|
| `streak-7` | Week Warrior | 7-day study streak | flame | 100 |
| `streak-30` | Monthly Master | 30-day study streak | zap | 500 |
| `top-20` | Top 20 | Ranked in top 20 | trophy | 300 |
| `top-10` | Elite Ten | Ranked in top 10 | crown | 500 |
| `perfect-attendance` | Perfect Month | 100% attendance in a month | calendar | 200 |
| `resource-explorer` | Resource Explorer | Viewed 50 resources | book | 150 |

View progress on **Student → Achievements** (points, streak, badges earned/total).

---

## Animations & motion

All motion respects **`prefers-reduced-motion`** — animations degrade to static layouts on request.

### Site-wide custom cursor (`IcvfSiteCursor`)
- Spring-physics pointer + hover ring + *ICTF* label (Framer Motion)
- Enabled on fine pointers only (disabled on touch / coarse devices)
- Expands ring on interactive elements; restores native text cursor in inputs
- Lazy-loaded to keep marketing bundle lean

### Marketing hero (`globals.css` + `hero-decor.tsx`)
| Class / effect | Description |
|----------------|-------------|
| `hero-circuit-flow` | Animated circuit path stroke |
| `hero-grid-scan` | ICT grid scan overlay |
| `hero-node-pulse` | Pulsing network nodes |
| `hero-orbit-spin` | Slow orbital ring rotation |
| `hero-binary-drift` | Floating binary bits |
| `hero-code-blink` | Blinking code-line accent |
| `hero-theme-drift` | Soft gold/navy orb drift |
| `hero-float` / `hero-float-slow` | Vertical float on decor elements |
| `hero-trust-marquee` | Infinite trust-logo marquee (36s) |
| `hero-learning-chips-marquee` | Program chip marquee (28s) |
| `hero-code-marquee` | Code snippet marquee (32s) |
| `hero-badge-pulse` | Accent badge glow pulse |

### Scroll & section motion (`motion-section.tsx`)
- **`MotionSection`** — fade-up on scroll into view (Framer Motion `whileInView`)
- **`MotionStagger`** / **`MotionStaggerItem`** — staggered children reveal
- Used across landing sections (programs, FAQ, contact, map, etc.)

### Counters & cards
- **`AnimatedCounter`** — intersection-triggered number count-up for site stats
- **`FlipCard`** — 3D CSS `rotateY` flip for student profile card (700ms)
- **Glass cards**, gradient stat blocks, Recharts transitions on results/leaderboard

### Portal UX
- Route-level `loading.tsx` skeletons (student, admin, parent)
- Sonner toasts, sidebar transitions, command palette
- Theme toggle with `next-themes` (light / dark / system)

---

## Quick Start

```bash
git clone https://github.com/RavirajSarangan/vithuictf.git
cd vithuictf
npm install
cp .env.example .env.local   # Add Supabase + optional Resend keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Apply database migrations

**Option A — Supabase CLI (recommended)**

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

**Option B — SQL Editor**

```bash
npm run db:combine
```

Open `supabase/all-migrations-combined.sql` in **Supabase Dashboard → SQL Editor** and run it.

**Option C — Direct psql**

```bash
# Set SUPABASE_DB_PASSWORD in .env.local
npm run db:bootstrap
```

> Do not use `supabase/apply-all.sql` alone — it is outdated. Apply files in `supabase/migrations/` in timestamp order.

### Migration files (25)

| # | File | Purpose |
|---|------|---------|
| 1 | `20240624120000_initial_schema.sql` | Core LMS tables, RLS, `handle_new_user` |
| 2 | `20240624120001_storage_policies.sql` | Private `resources` bucket |
| 3 | `20240624120002_seed_reference_data.sql` | Courses, FAQs, stats, badge definitions |
| 4 | `20240625120000_remove_attendance.sql` | Remove attendance feature |
| 5 | `20240625120001_home_cms.sql` | Home page CMS tables + seed |
| 6 | `20240625120002_calendar.sql` | Calendar categories + sessions |
| 7 | `20240625120003_bilingual_home.sql` | Tamil columns on home CMS |
| 8 | `20240625120004_paper_center_map_coords.sql` | Map pin coordinates |
| 9 | `20240625120005_admin_storage_bucket.sql` | Public `admin` bucket for CMS images |
| 10 | `20240625120006_backend_hardening.sql` | Student auto-provision, bilingual company fields |
| 11 | `20240625130000_courses_catalog.sql` | Courses catalog |
| 12 | `20240625140000_student_onboarding.sql` | Student onboarding steps |
| 13 | `20240625150000_student_profile_card.sql` | Shareable profile card fields |
| 14 | `20240625160000_contact_inquiries.sql` | Contact form storage |
| 15 | `20240625160100_admin_audit_log.sql` | Admin audit trail |
| 16 | `20240625160200_certificates_verify.sql` | Certificate verification codes |
| 17 | `20240625160300_platform_settings.sql` | Platform-wide settings |
| 18 | `20240625170000_student_registration_fields.sql` | Extended registration fields |
| 19 | `20240625180000_fix_handle_new_user_student_provision.sql` | Registration trigger fix |
| 20 | `20240625190000_student_exam_year_ict_grade.sql` | Exam year & ICT grade |
| 21 | `20240625200000_student_nic_number.sql` | NIC number field |
| 22 | `20240625210000_marketing_coming_soon.sql` | Coming-soon portal flags |
| 23 | `20240625220000_site_public_mode.sql` | Site public / maintenance mode |
| 24 | `20240626120000_seo_unblock_and_faqs.sql` | SEO pages + FAQ expansion |
| 25 | `20240626130000_restore_marketing_coming_soon.sql` | Restore marketing coming-soon default |

### Verify connection

```bash
npm run db:verify
```

### First admin user

1. Register a student account, or create a user in Supabase Auth dashboard
2. Run [`scripts/promote-admin.sql`](scripts/promote-admin.sql) in SQL Editor (set your email)
3. Log in and use **Admin → Home** to manage marketing content

After migrations, student **Apply Now** creates `auth.users` + `profiles` + `students` rows (requires `SUPABASE_SERVICE_ROLE_KEY`).

---

## Environment Variables

```env
# Required — client-safe
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # legacy alias

# Required — server only (NEVER NEXT_PUBLIC_*)
SUPABASE_SERVICE_ROLE_KEY=...

# Optional
NEXT_PUBLIC_SITE_URL=https://ictf.lk
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=...
SITE_PUBLIC_MODE=live                  # skip DB gate fetch in middleware

# Resend — transactional email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL="ICT Foundation <noreply@ictf.lk>"
CONTACT_INBOX_EMAIL=info@ictf.lk
RESEND_REPLY_TO_EMAIL=info@ictf.lk

# Optional — scripts/supabase-bootstrap.sh
# SUPABASE_DB_PASSWORD=...
```

All three Supabase keys (URL, anon/publishable, service role) are required for real registration. With only URL + anon, the app runs in partial demo mode and **Apply Now** shows a configuration warning.

---

## Security Architecture

- **RLS enabled** on every public table
- **Roles stored in `profiles.role`** — never authorize via `user_metadata`
- **Registration** uses server action with service role to set `app_metadata.role`
- **Middleware** refreshes Supabase session; skips auth on public marketing routes without cookies
- **Admin mutations** go through server actions with staff/admin checks
- **Resources** served via short-lived signed URLs (300s TTL)
- **Audit log** for sensitive admin actions

---

## Demo Mode

Without Supabase env vars, the app falls back to in-memory demo data for local UI testing.

| Role | Email | Password |
|------|-------|----------|
| Student | `student@demo.ictf.lk` | `demo1234` |
| Parent | `parent@demo.ictf.lk` | `demo1234` |
| Admin | `admin@demo.ictf.lk` | `demo1234` |

---

## Project Structure

```
src/
├── app/
│   ├── (marketing)/     # Public site — EN / si / ta
│   ├── (auth)/          # Login & register
│   ├── (student)/       # Student LMS
│   ├── (parent)/        # Parent portal
│   ├── (admin)/         # Admin CMS & ops
│   ├── coming-soon/     # Gated portal previews
│   └── api/             # AI chat, Stripe webhook, PDF reports
├── components/
│   ├── landing/         # Marketing sections
│   ├── shared/          # Cursor, badges, motion, brand
│   └── ui/              # shadcn/ui primitives
├── lib/                 # Actions, Supabase, SEO, email
└── hooks/               # Domain data hooks
supabase/migrations/     # Ordered SQL migrations
public/
├── compliance/          # PDPA, ISO, PCI badge assets
└── landing/             # Hero, map, brand imagery
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Run production server locally |
| `npm run lint` | ESLint |
| `npm run analyze` | Bundle analyzer (`ANALYZE=true`) |
| `npm run deploy` | Deploy to Vercel production |
| `npm run db:combine` | Combine migrations into one SQL file |
| `npm run db:verify` | Test Supabase connection |
| `npm run db:test-registration` | Test registration backend |
| `npm run db:bootstrap` | Apply migrations via psql |
| `npm run db:migrate` | Apply pending migrations script |

---

## Performance

See [`PERFORMANCE.md`](PERFORMANCE.md) for the full audit. Highlights:

- ~66% reduction in `public/` asset size (hero PNG vs legacy SVG)
- Marketing below-fold sections lazy-loaded with `dynamic()`
- Middleware skips session refresh on cookie-less public routes
- `@vercel/speed-insights` + Analytics in production
- 48 routes compile on `npm run build`

---

## Brand

| | |
|---|---|
| **Name** | ICTF — ICT Foundation |
| **Legal** | ICT Foundation (Pvt) Ltd |
| **Tagline** | Shaping the Future of Education |
| **Contact** | info@ictf.lk · +94 77 459 1161 |
| **Location** | Jaffna, Sri Lanka |
| **Colors** | Navy `#273461` · Accent `#F5A623` |

Logo assets: `public/ICTF.svg` (dark backgrounds), `public/ICTF PNG 4.png` (light backgrounds).

---

## License

MIT — see [LICENSE](LICENSE).

---

<p align="center">
  <strong>ICT Foundation</strong> · Shaping the Future of Education<br/>
  <a href="https://ictf.lk">ictf.lk</a> · <a href="https://github.com/RavirajSarangan/vithuictf">GitHub</a>
</p>
