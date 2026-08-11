# MaidLinx MVP Audit & Plan

**Date:** 2026-08-10  
**Scope:** Root MaidLinx app (`/Users/avnee/website`). Ignore `wingman/`.

## Exists (working code paths)

| Area | Status | Notes |
|------|--------|-------|
| Customer book wizard | **PASS** | `/book` steps: address → property → details → service → extras → schedule → review → payment → confirmation |
| Customer dashboard | **PASS** | Bookings, favorites, invoices, receipts, profile, notifications |
| Auth + roles | **PASS** | Supabase Auth; `customer` / `cleaner` / `admin`; middleware gates `/dashboard`, `/cleaner`+`/pro`, `/admin` |
| Cleaner portal | **PARTIAL** | Canonical `/cleaner` (`/pro` redirects here). Jobs, accept, status ladder, checklist, photos, availability, earnings, ratings, profile, capabilities |
| Job offer privacy | **PASS** | `sanitizeAvailableJob` hides street/contact until assigned |
| Matching | **PASS** | Eligibility gates + weighted score; admin suggestions + offers tables |
| Admin ops | **PASS / PARTIAL** | Customers, cleaners, bookings, assign, payments, disputes, pricing UI, markets/zones pages |
| Schema | **PASS** | Migrations `00001`–`00017`: users/customers/cleaners, markets, zones, services, offers, quotes, payouts, webhook idempotency, cleaner signup trigger |
| Stripe deposit | **PASS** (code) | Needs keys; TEST mode only |

## Missing vs product brief

| Gap | Priority |
|-----|----------|
| Cleaner onboarding statuses + checklist UI | **P0** |
| Online/offline presence for matching | **P0** |
| Documents table + Pro documents screen | **P0** |
| Unavailable dates in DB | **P0** |
| Stripe Connect status machine (hosted onboarding) | **P1** |
| True Pro home (greeting + today earnings + upcoming) | **P0** |
| Separate Date / Time / Access booking screens | **P2** (schedule step combined today) |
| Auto-dispatch | **Later** (manual + offers OK for MVP) |
| Google Maps autocomplete | **Blocked** (empty `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) |
| Live Stripe / Supabase | **Blocked** (empty env keys) |

## Security / data issues

1. **Service-role heavy APIs** — correctness depends on `requireSession` / role checks on every route.
2. **False “background check” marketing copy** in FAQ — must not claim without real verification.
3. **Cleaner create path** could set `is_active: true` / `onboarding_complete: true` too early — gate on approval.
4. **Guest booking HMAC** — ensure `BOOKING_ACCESS_SECRET` in production.
5. **CAD vs USD** — market-aware currency must stay wired when Toronto goes live.
6. **Do not collect bank numbers** — Connect only; stay TEST mode.

## Routing decision

- Keep **`/cleaner` as canonical** implementation (avoids breaking middleware, APIs, tests).
- Keep **`/pro` → `/cleaner`** redirects; add **`/pro/signup` → `/earn`**.
- Extend `/cleaner` with `home`, `onboarding`, `documents` (served also via `/pro/...`).

## Phases

1. **Foundation (this session):** onboarding/online/connect/docs schema; Pro home; onboarding + documents scaffolding; role-safe defaults; FAQ honesty; tests.
2. **Pro completeness:** full checklist persistence, admin approval queue UX, unavailable dates UI, Connect TEST Account Links.
3. **Customer polish:** split schedule/access steps; matching status screen; Maps when key ready.
4. **Payments:** balance collection; Connect payouts (TEST); no live mode without explicit go-ahead.
5. **Hardening:** full suite green in CI; production deploy only after secrets + Stripe Connect dashboard config.

## STOP items (need user)

- Pick GCP project + enable Maps billing / key restrictions.
- Fill Supabase + Stripe **TEST** keys in `.env.local` (do not paste into chat).
- Stripe Connect platform settings in Dashboard (TEST).
- Production deploy, live Stripe, identity verification, legal acceptance.
