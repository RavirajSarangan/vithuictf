# Performance Audit — Post-Implementation Report

Date: June 25, 2026  
Project: ICTF Student Portal (Next.js 16 + Supabase + Vercel)

## Summary

Full performance, device support, and cleanup pass completed across six phases. Production build passes (`npm run build`) with 48 routes.

## Before / After Metrics

| Metric | Before (audit) | After |
|--------|----------------|-------|
| `public/` total size | ~6.2 MB | **2.1 MB** (~66% reduction) |
| Hero LCP asset | `/vithoo.svg` (1.7 MB) | `/landing/hero-founder.webp` (63 KB) |
| Dead public assets | `Jaffna .svg` (3.7 MB), unused brand folder | Removed |
| Middleware auth on marketing `/` | Always (Supabase session + profile) | Skipped when no auth cookie |
| Site gate DB fetch | Every request, `cache: no-store` | 60s in-memory cache + env override |
| Marketing homepage JS | All sections eager-loaded | Below-fold sections `dynamic()` |
| Recharts on admin/parent | Static import | Lazy-loaded chart components |
| `use-data.ts` | 762-line monolith | Split into domain hooks + barrel |
| Error recovery UI | None | `error.tsx`, `global-error.tsx`, `not-found.tsx` |
| Route loading UI | Student only | Student, admin, parent |
| Observability | Vercel Analytics only | + `@vercel/speed-insights` |
| Unused npm packages | three, motion, vaul, @ai-sdk/gateway, etc. | Removed (17 packages) |
| Dead components | 19+ landing/auth/canvas files | Removed |

## Changes by Phase

### Phase 1 — Assets
- Hero uses optimized PNG; removed `unoptimized` on founder photo
- Deleted ~5.4 MB unused SVGs and scaffold assets
- Logo intrinsic dimensions corrected (188×72)
- Google Maps iframe lazy-loads on scroll (`LazyMapEmbed`)

### Phase 2 — Network
- `fetchSitePublicMode()` cached 60s; supports `SITE_PUBLIC_MODE` env
- Middleware skips `updateSession` on public routes without auth cookies
- Static cache headers for `/landing`, `/compliance`, `/team`
- `AuthProvider` moved to portal/auth layouts only (marketing skips Supabase on mount)
- `IcvfSiteCursor` dynamically imported; consolidated on `framer-motion`

### Phase 3 — Bundles
- `optimizePackageImports` for lucide, recharts, date-fns, remixicon
- Dynamic recharts: admin analytics, parent performance
- Dynamic marketing homepage sections
- Hooks split: `use-student-data.ts`, `use-admin-data.ts`, `use-marketing-data-hooks.ts`
- `@next/bundle-analyzer` — run with `npm run analyze`

### Phase 4 — Cleanup
- Removed unused landing sections, animate-ui, Three.js canvas, dead shadcn scaffolds
- Trimmed `marketing-content.ts`, legacy admin actions, `useCompanies`
- Uninstalled: `three`, `@react-three/fiber`, `@types/three`, `vaul`, `motion`, `@ai-sdk/gateway`

### Phase 5 — Device & UX
- Hero breakpoint aligned to 768px (Tailwind `md`)
- Desktop marketing header: login + language toggle parity
- Admin/parent `loading.tsx` skeletons
- `useCachedList` returns `{ error, retry }`

### Phase 6 — Monitoring
- `@vercel/speed-insights` in root layout
- Production build verified

## Verification Checklist

| Test | Status |
|------|--------|
| `npm run build` | Pass |
| All 48 routes compile | Pass |
| Public folder under 2 MB target | Pass (2.1 MB) |
| Bundle analyzer available | `npm run analyze` |
| Speed Insights | Installed |

## Recommended Follow-ups

1. Run Lighthouse mobile audit on deployed preview (Slow 4G) and compare LCP/INP
2. Run `npm run analyze` and confirm marketing `/` initial JS chunks
3. Set `SITE_PUBLIC_MODE=live` in env if site gate rarely changes (eliminates middleware fetch entirely)
4. Consider converting high-traffic portal pages to server components incrementally

## Known Limitations

- **No PWA/offline** — intentional; online-only optimization
- **Portal pages remain client-heavy** — auth-gated; split hooks + lazy charts mitigate bundle size
- **Marketing data** may log cookie warnings during static generation — falls back gracefully
