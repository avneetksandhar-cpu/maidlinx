# MaidLinx Platform Plan

**Status:** Audit / planning document only — do not treat this file as an implementation checklist that has been executed.  
**Created:** 2026-08-10  
**Repo root:** `/Users/avnee/website`  
**Constraint:** Evolve incrementally. Preserve working auth, booking, payments, and dashboards. Coordinate with in-flight parallel agents; do not rewrite or duplicate their modules.

---

## Parallel work reality (inspect honestly)

| Agent / workstream | Evidence in repo | Status |
|--------------------|------------------|--------|
| Marketplace evolution (`9fed8c4f`) | `src/config/markets.ts`, `src/config/services.ts` created ~18:08; transcript shows audit-then-implement brief | **PARTIAL / in progress** — TypeScript config catalogs only; **not** wired into booking UI, pricing, APIs, or DB migrations yet |
| Match score / dispatch | `src/lib/matching/*`, `src/lib/admin/matches.ts`, `GET /api/admin/bookings/[id]/matches`, admin UI “Suggested cleaners” in `src/components/admin/booking-detail-panel.tsx`, `docs/MATCHING.md` | **PASS (admin ranking)** — scores active cleaners; **no hard eligibility gate before scoring** (only `activeOnly` filter) |
| Algorithms roadmap | `docs/ALGORITHMS.md`, stubs under `src/lib/{service-area,availability,eta,reliability,repeat-match,demand,fraud,recommendations}/` | Stubs throw `TODO` errors — do not call from production paths |
| Existing MVP product docs | `MVP.md`, `docs/DATABASE.md`, `README.md` | Authoritative for current lifecycle & schema intent |

**Coordination rule:** Integrate with `src/lib/matching/` and `src/config/{markets,services}.ts`. Do not create a second score engine or a second markets/services source of truth. Prefer extending those files and adding migrations that mirror the config shapes.

**Git reality:** Almost the entire MaidLinx tree (`src/`, `supabase/`, `docs/`, etc.) is **untracked** on `main`. Committed history is the older Wingman app (`wingman/`). Treat local filesystem as source of truth for this audit.

---

## 1. Existing architecture

### Stack

| Layer | Choice | Key paths |
|-------|--------|-----------|
| Framework | Next.js 16 App Router + React 19 + TypeScript | `package.json`, `src/app/` |
| Styling | Tailwind CSS 4 | `postcss.config.mjs`, component CSS variables |
| Auth | **Supabase Auth** (Clerk webhook stubbed out as 410) | `src/lib/auth/*`, `src/middleware.ts`, `src/lib/supabase/middleware.ts`, `src/app/api/webhooks/clerk/route.ts` |
| Database | Supabase PostgreSQL + RLS | `supabase/migrations/00001`–`00009`, `src/types/database.types.ts` |
| Payments | Stripe PaymentIntents + webhook | `src/lib/stripe/`, `src/app/api/bookings/[id]/checkout/route.ts`, `src/app/api/webhooks/stripe/route.ts`, `src/lib/payments/deposit.ts` |
| Forms / validation | React Hook Form + Zod | `src/lib/validations/`, booking components |
| Tests | Vitest | `vitest.config.ts`, pricing/matching/booking tests |
| Deploy | Vercel | `vercel.json` |

### Routing (App Router)

| Area | Route group | Examples |
|------|-------------|----------|
| Marketing / book | `(marketing)`, root | `/`, `/book`, `/book/confirmation/[id]`, `/earn` |
| Auth | `(auth)` | `/sign-in`, `/sign-up` |
| Customer | `(platform)/dashboard` | bookings, invoices, receipts, favorites, profile, notifications |
| Cleaner | `(platform)/cleaner` (+ legacy `/pro` redirects) | jobs, schedule, availability, earnings, ratings, profile |
| Admin | `(platform)/admin` | bookings, customers, cleaners, payments, pricing, service-areas, disputes, refunds, payouts, coupons, analytics, audit, permissions, logs |
| Onboarding | `(platform)/onboarding` | **shell only** — `PlatformShell` placeholder |
| APIs | `src/app/api/**` | bookings, dashboard, cleaner/pro, admin, webhooks, health |

`next.config.ts` redirects `/pro` → `/cleaner` and `/api/pro` → `/api/cleaner` (dual portals kept for compatibility).

### Auth & authorization

- Session via Supabase SSR cookies (`src/lib/supabase/server.ts`, middleware refresh).
- Roles: `customer` | `cleaner` (legacy DB value `professional` normalized) | `admin` — `src/lib/auth/roles.ts`.
- Middleware gates `/dashboard`, `/cleaner`, `/admin`, cleaner APIs by role — `src/lib/supabase/middleware.ts`.
- Admin permissions matrix exists (`src/lib/admin/permissions.ts`) but bootstrap admins get **all** permissions; `admin_permissions` table is lightly used.
- `ADMIN_BOOTSTRAP_EMAIL` promotes first matching sign-in to admin (`src/lib/auth/profiles.ts`, `src/lib/admin/session.ts`).
- Server data paths heavily use **service role** (`createAdminClient`) after app-level auth checks — RLS is not the sole enforcement layer.

### Database (migrations present)

Ordered under `supabase/migrations/`:

1. `00001_initial_schema.sql` — profiles, addresses, professionals, bookings, reviews (Clerk-era)
2. `00002_booking_flow.sql` — guest fields, extras jsonb, geo on booking
3. `00003_customer_dashboard.sql` — favorites, notification prefs, invoices
4. `00004_cleaner_dashboard.sql` — checklist, job photos, `professional_availability`
5. `00005_admin_dashboard.sql` — pricing_config, coupons, service_areas, disputes, refunds, audit, permissions
6. `00006_mvp_foundation.sql` — Supabase Auth alignment, `services` seed table, `payments`, `job_status_history`, baseline RLS
7. `00007_mvp_table_alignment.sql` — `profiles`→`users`, `professionals`→`cleaners`, `customers`, `booking_extras`, `cleaner_assignments`, compat views
8. `00008_booking_status_mvp.sql` — MVP status enum
9. `00009_cleaner_portal_rls.sql` — available-job / accept / update policies

Documented ERD & naming: `docs/DATABASE.md`.

**No migration yet** for `markets`, `service_zones`, `market_services`, `cleaner_service_zones`, multi-service category columns, or marketplace eligibility tables — those exist only as TS config drafts.

### Booking / pricing / matching

- **Booking engine (working):** multi-step wizard → quote → create booking (`pending_payment`) → Stripe deposit → webhook → `awaiting_cleaner` → admin assign or cleaner self-accept → status ladder → complete.  
  Paths: `src/components/booking/*`, `src/hooks/use-booking-state.ts`, `src/lib/bookings/repository.ts`, `src/app/api/bookings/*`.
- **Pricing (working, hardcoded USD):** `src/lib/pricing/calculateQuote.ts` + `src/lib/pricing/config.ts`. Admin `pricing_config` / DB `services` are **not** the live quote source.
- **Matching (admin suggestions):** `computeMatchScore` + `rankCleanersForBooking`. Soft factors include distance/service-area membership; inactive cleaners can be filtered out. **Eligibility-before-score is missing.**

### Markets / multi-service (started, not integrated)

- `src/config/markets.ts` — Toronto/GTA (CAD) + South Florida (USD), zones, `resolveMarket()`.
- `src/config/services.ts` — marketplace catalog (residential, deep, move, airbnb, office, post-construction, event, recurring), tiles, `instant` vs `quote` pricing models, dynamic question schemas.
- **Neither file is imported** by booking UI, APIs, pricing, or matching as of this audit (grep shows definitions only).

### Environment & deployment

- Template: `.env.example` (Supabase, Stripe, deposit %, email/SMS providers, admin bootstrap, booking access secret, optional Google Maps, Sentry).
- **`.env.local` is missing** on this machine → auth/booking storage/payments cannot run end-to-end without configuration (**REQUIRES CONFIGURATION**).
- Env validation: `src/config/env.ts` (many keys optional so UI can degrade).
- Deploy target: Vercel (`vercel.json`); Stripe webhook must point at `/api/webhooks/stripe`.

### Leftover / non-product

- `wingman/` — separate Next app (committed); not the MaidLinx product surface.
- `src/lib/clerk/` — empty/legacy naming residue; Clerk webhook returns 410.
- Dual `pro` + `cleaner` API/page trees — redirects mitigate, but code duplication remains.

---

## 2. Existing working features

Legend: **PASS** = implemented and wired; **PARTIAL** = UI/API/schema exists but incomplete, degraded, or not end-to-end; **MISSING** = not present.

### Customer journey (vision: request → price → schedule → pay → match → track → rate)

| Step | Status | Notes / paths |
|------|--------|---------------|
| Request / address | **PASS** | Booking wizard address + optional Google Places (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) |
| Market resolution from address | **PARTIAL** | `resolveMarket()` exists in config; **not** called from booking |
| Choose service | **PARTIAL** | Fixed residential-style catalog in `BOOKING_SERVICES` (`src/lib/bookings/constants.ts`); marketplace tiles/catalog in `services.ts` unused |
| Dynamic questions by service | **MISSING** | Wizard steps are fixed (property/service/extras); config questions not rendered |
| Price / quote | **PASS** (residential instant) / **MISSING** (quote-only commercial) | Live path always instant USD quote |
| Schedule | **PASS** | Date + arrival windows |
| Pay deposit | **PASS** (when Stripe+Supabase configured) | Checkout PI + webhook; guest HMAC access token |
| Match / assign | **PARTIAL** | Admin ranked suggestions + manual assign; cleaner marketplace self-accept; **no auto-match** (intentional per `MVP.md`) |
| Track job status | **PARTIAL** | Customer dashboard bookings + status badges; notifications on some status changes (`notifyJobStatusChange`) — not a live map/ETA tracker |
| Rate cleaner | **MISSING** (customer write) | `reviews` table + cleaner can **read** ratings; no customer submit-review API/UI found |
| Favorites / reschedule / cancel | **PASS / PARTIAL** | Favorites API+UI; cancel/reschedule dialogs exist in dashboard components |

### Cleaner journey (vision: onboard → services → zones → availability → jobs → status → checklist → earnings)

| Step | Status | Notes / paths |
|------|--------|---------------|
| Sign up as cleaner | **PARTIAL** | `/earn` → `/sign-up?role=cleaner`; AuthForm stores `role` in user metadata; **DB trigger `handle_new_user` always inserts `customer`** (unless bootstrap admin) — cleaner role depends on app `ensureProfileForUser` / `ensureProfessionalProfile` path, which can race with the trigger |
| Dedicated onboarding | **MISSING** | `/onboarding` is empty shell |
| Select services offered | **MISSING** | No cleaner↔service association beyond booking `service_type` heuristics in matching |
| Select markets / zones | **MISSING** | Radius + admin `service_areas` only; no `cleaner_service_zones` |
| Availability | **PASS** | Weekly windows UI + `professional_availability` |
| Browse / accept jobs | **PASS** | Cleaner jobs APIs + RLS for `awaiting_cleaner` |
| Status ladder | **PASS** | Validated transitions in `src/lib/pro/job-transitions.ts` |
| Checklist + photos | **PASS** | Job checklist + before/after photos |
| Earnings | **PARTIAL** | Aggregates completed `subtotal_cents`; Stripe Connect listing filters `role = professional` only (easy to miss cleaners); no full Connect onboarding UX |
| Ratings view | **PASS** (read) | Cleaner ratings page |

### Admin (vision: markets / services / pricing / bookings / cleaners / assignments / payments / disputes / ops)

| Area | Status | Notes |
|------|--------|-------|
| Bookings + status + assign | **PASS** | Including match suggestions |
| Customers / cleaners CRUD-ish | **PASS** | List/update via admin libs |
| Payments / refunds | **PASS / PARTIAL** | Lists + refund records; Stripe-dependent |
| Pricing admin | **PARTIAL** | Edits `pricing_config`; **booking quote ignores DB** |
| Service areas | **PARTIAL** | CRUD on `service_areas`; not the new markets/zones model; matching uses these postal/city sets |
| Markets admin | **MISSING** | Config file only |
| Multi-service catalog admin | **MISSING** | DB `services` seed exists but unused by quote engine / marketplace config |
| Disputes | **PASS** (admin CRUD) | Customer raise path thin |
| Payouts / Connect | **PARTIAL** | Stripe payout list; Connect accounts incomplete |
| Analytics / revenue / audit / logs / permissions | **PARTIAL** | Pages + metrics exist; depth varies; permissions mostly all-or-nothing for bootstrap admin |
| Ops matching | **PASS** (suggest) / **MISSING** (auto-dispatch) | Per MVP |

### Platform / infra

| Item | Status |
|------|--------|
| PWA manifest / SW | **PARTIAL** — `public/manifest.json`, `sw.js` present |
| Email/SMS | **PARTIAL** — providers implemented; default `log` |
| Health endpoint | **PASS** — `/api/health` |
| Algorithm stubs | Present, unimplemented (by design) |

---

## 3. Missing features (vs marketplace vision)

### Product gaps (must build incrementally)

1. **Multi-market runtime** — persist markets/zones; resolve on book; currency/timezone from market (CAD vs USD); gate out-of-area addresses.
2. **Multi-service marketplace UX** — homepage tiles (“What do you need cleaned?”), service-driven questions, quote-only path for commercial/post-construction/event.
3. **DB-backed service catalog + market_services** — admin-editable; sync with / supersede hardcoded `BOOKING_SERVICES` carefully.
4. **Cleaner capabilities** — services offered, zones covered, qualifications/vehicle/preferences; filter available jobs by eligibility.
5. **Matching eligibility before scoring** — hard gates (active, verified policy, market/zone, service capability, availability/no double-book, travel radius) then score; extend `src/lib/matching/`, do not fork.
6. **Customer rating submission** after `completed`.
7. **Reliable cleaner signup / onboarding** — fix trigger vs metadata role; create `cleaners` row; collect zones/services.
8. **Balance / full payment & cleaner payouts** — deposit works; balance collection and Connect payouts incomplete.
9. **Admin markets & services ops** — CRUD aligned with new schema.
10. **Status model alignment** — marketplace brief wants `awaiting_assignment` / `offered` / `accepted` / `on_the_way` / `arrived`; current MVP uses `awaiting_cleaner` / `assigned` / `cleaner_on_way` / `cleaner_arrived`. Prefer **mapping/aliases** over a breaking enum rewrite mid-flight.
11. **Wire `src/lib/service-area` + `src/lib/availability`** stubs into matching eligibility (today matching embeds soft geo heuristics instead).

### Explicitly out of scope for early phases (keep stubs)

AI, subscriptions, referrals, demand forecasting, fraud engine, recommendations, live ETA/maps routing — see `MVP.md` / `docs/ALGORITHMS.md`.

---

## 4. Security concerns

| Concern | Severity | Detail |
|---------|----------|--------|
| No `.env.local` / secrets on disk | Ops | Local cannot authenticate or persist bookings; fine for audit, blocks E2E |
| Service-role bypass of RLS | High (design) | Most booking/admin/cleaner repositories use `SUPABASE_SERVICE_ROLE_KEY`. Correctness depends on every API calling `requireSession` / `requireAdminPermission`. Audit new routes carefully |
| Cleaner role assignment race | High | DB `handle_new_user` forces `customer`; signup metadata `role=cleaner` may be ignored by trigger → cleaners stuck as customers until app code repairs |
| Guest booking access tokens | Medium | HMAC over booking id; secret falls back to webhook secret or **dev default** in non-production (`src/lib/bookings/access-token.ts`). Ensure `BOOKING_ACCESS_SECRET` in prod |
| Admin bootstrap email | Medium | Single email → full admin; protect env in Vercel |
| Clerk leftovers | Low | Webhook 410; `clerk_user_id` column still written with Supabase user id — confusing, not an open Clerk path |
| Permissions UI vs enforcement | Medium | Fine-grained permissions exist but bootstrap path grants all; ensure non-bootstrap admins actually load `admin_permissions` |
| PII in cleaner marketplace | Medium-low | Available jobs strip some PII (`jobs.ts`); re-verify as multi-service notes/questions grow |
| Stripe Connect incomplete | Medium | Earnings UX without proper Connect onboarding/payouts risks manual/unsafe money movement |
| Dual currency without market binding | Medium | Pricing hardcoded `USD` while Toronto market config claims `CAD` — wrong charges if markets go live without pricing work |

---

## 5. Database changes required

Align with marketplace agent intent and existing MVP tables. Prefer **additive** migrations (`00010+`).

### New tables (recommended)

| Table | Purpose |
|-------|---------|
| `markets` | id, slug, name, country, currency, timezone, active, center lat/lng |
| `service_zones` | id, market_id, name, active, postal_codes[], cities[], optional boundary |
| `marketplace_services` **or** evolve `services` | Extend seed `services` with slug, category, icon, pricing_model (`instant`\|`quote`), active, sort_order, question schema (jsonb) — avoid dual catalogs |
| `market_services` | Which services are offered in which market (+ optional price overrides) |
| `cleaner_services` | Cleaner ↔ service capabilities |
| `cleaner_service_zones` | Cleaner ↔ zone coverage (plus keep `service_radius_km`) |
| Optional: `booking_answers` | Dynamic question responses (jsonb on `bookings` is acceptable short-term) |

### Columns on existing tables

| Table | Additions |
|-------|-----------|
| `bookings` | `market_id`, `service_zone_id`, `marketplace_service_id` (or service slug), `pricing_model`, `answers` jsonb, keep `service_type` for legacy |
| `cleaners` | optional vehicle/qualifications jsonb; home market |
| `addresses` | optional `market_id` / `service_zone_id` cache |
| `payments` | already supports deposit/balance/full/refund — ensure balance flow writes rows |

### Status enum strategy (critical)

**Do not casually replace** `booking_status` again so soon after `00008`. Options:

1. **Preferred near-term:** Keep MVP statuses; map product language in UI (`Awaiting assignment` → `awaiting_cleaner`, `On the way` → `cleaner_on_way`).
2. **Later:** Additive enum values (`offered`, etc.) + data migration only when offer/accept marketplace loop ships.

Auto-matching remains out of MVP scope (`MVP.md`); eligibility still required for admin rank + cleaner job feed.

### Seed data

- Seed Toronto/GTA + South Florida from `src/config/markets.ts`.
- Seed marketplace services from `src/config/services.ts`, mapping `legacyServiceType` ↔ existing enum / `services.id`.
- Backfill `bookings.market_id` via postal/city resolution where possible.

---

## 6. Migration strategy

1. **Freeze working paths** — booking create, Stripe webhook → `awaiting_cleaner`, cleaner transitions, admin assign must keep green tests.
2. **Add `00010_markets_and_zones.sql`** — tables + seed; no app break.
3. **Add `00011_marketplace_services.sql`** — extend `services` (or new table + view) + `market_services`; keep old `service_type` enum values; add new enum values only if needed (`post_construction`, `event_venue`) via `ALTER TYPE ... ADD VALUE`.
4. **Add `00012_cleaner_capabilities.sql`** — `cleaner_services`, `cleaner_service_zones`.
5. **Add `00013_booking_market_fields.sql`** — nullable FKs on bookings; backfill; app starts writing new fields while reading legacy.
6. **Fix auth trigger** — migration updating `handle_new_user` to honor `raw_user_meta_data.role` ∈ {cleaner, customer} and insert `customers` / `cleaners` rows accordingly (coordinate with `00007` triggers).
7. **App cutover (non-breaking):**
   - Booking: resolve market → filter services → dynamic questions → currency from market → create booking with new FKs.
   - Pricing: still use `calculateBookingPrice` for instant residential; quote-only skips PI.
   - Matching: add `eligibility.ts`; filter then call existing `rankCleanersForBooking`.
   - Cleaner jobs list: eligibility filter.
8. **Admin:** markets/services pages after read path stable.
9. **Deprecate** hardcoded city checks (none should be added; route all geo through markets module / DB).
10. **Types:** regenerate or hand-update `src/types/database.types.ts` after migrations.

Rollback: keep columns nullable; feature-flag UI tiles if needed; never drop `service_type` in the first release.

---

## 7. Implementation phases (prioritized, incremental — NOT a rewrite)

### Phase 0 — Coordination & config truth (now / parallel-safe)

- Treat `src/config/markets.ts` + `src/config/services.ts` as the **application catalog**; migrations mirror them.
- Document ownership: matching stays in `src/lib/matching/`; marketplace agent wires eligibility into it.
- Add `.env.local` from `.env.example` for local verification (**configuration**, not code).

### Phase 1 — Markets + service-area gate

- Migrations for markets/zones; admin read of markets (even if edit is config-driven initially).
- Call `resolveMarket` (and/or DB) in booking address step; block or warn outside Toronto/GTA & South Florida.
- Currency/timezone display from market (pricing CAD later if needed).

### Phase 2 — Multi-service booking UX

- Homepage: brand-first hero + address + “What do you need cleaned?” tiles from `SERVICE_TILES` (preserve MaidLinx look; no fake social proof).
- Dynamic questions from `requiredQuestions`; map into existing booking state via `mapsTo`.
- Quote-only services: create booking without Stripe PI (or `pending_payment` + admin quote workflow) — product decision; preserve deposit path for `instant`.
- Extend pricing/validation schemas for new service ids **without** deleting residential flow.

### Phase 3 — Cleaner capabilities + eligibility

- Fix cleaner signup/trigger; real onboarding for services + zones + availability.
- Implement `src/lib/matching/eligibility.ts` (hard gates) → then existing score/rank.
- Filter cleaner available-jobs feed with same eligibility.
- Start implementing `src/lib/availability` conflict checks used by eligibility (stop leaving stub throws in the hot path).

### Phase 4 — Admin ops for marketplace

- Admin markets / services / market_services; wire pricing admin into quote engine **or** clearly mark DB pricing as source of truth and migrate `calculateQuote` to read it.
- Assignment UI continues to use ranked eligible cleaners.

### Phase 5 — Payments completeness + ratings

- Balance due collection; Connect onboarding for cleaners; payout ops hardened.
- Customer review submit after completion; update cleaner aggregates.

### Phase 6 — Status/offers (only if product needs offer loop)

- Additive statuses for `offered` / decline; still no forced auto-match until ops ready.

### Phase 7 — Later algorithms

- ETA, reliability composite, demand, fraud, recommendations — per `docs/ALGORITHMS.md`.

---

## 8. Files that will change

### Config & docs

- `src/config/markets.ts`, `src/config/services.ts` (extend; keep as source)
- `src/config/site.ts`, `src/config/env.ts` (if new public flags)
- `MVP.md`, `docs/DATABASE.md`, `docs/MATCHING.md`, `docs/ALGORITHMS.md` (status/eligibility notes)
- `.env.example` (market/currency notes if needed)

### Booking / pricing / validation

- `src/lib/bookings/constants.ts`, `repository.ts`, `status.ts`
- `src/lib/pricing/*` (currency/market-aware; optional DB-backed rates)
- `src/lib/validations/booking-flow.ts`
- `src/hooks/use-booking-state.ts`
- `src/components/booking/**` (wizard steps, homepage composition)
- `src/app/page.tsx`, `src/app/(marketing)/book/**`
- `src/app/api/bookings/**`

### Matching / availability / service-area

- `src/lib/matching/rank.ts`, `index.ts`, `types.ts`, `score.ts` (consume eligibility)
- `src/lib/admin/matches.ts`
- `src/lib/service-area/index.ts`, `src/lib/availability/index.ts` (implement vs stub)
- Cleaner jobs: `src/lib/pro/dashboard/jobs.ts`, `src/app/api/cleaner/jobs/**`

### Auth / cleaner onboarding

- `supabase/migrations` trigger fix
- `src/lib/auth/profiles.ts`, `src/components/auth/auth-form.tsx`
- `src/lib/professionals/repository.ts`
- `src/app/(platform)/onboarding/page.tsx`, cleaner profile/settings UI
- `src/app/(marketing)/earn/page.tsx`

### Admin

- `src/lib/admin/service-areas.ts` → evolve or complement with markets
- `src/lib/admin/pricing.ts`, admin pricing/service pages
- New admin pages under `src/app/(platform)/admin/`
- `src/components/admin/booking-detail-panel.tsx` (eligible-only suggestions)

### Types / tests

- `src/types/database.types.ts`
- `src/lib/matching/score.test.ts` + new eligibility/pricing/booking tests
- `src/lib/pricing/calculateQuote.test.ts`

### Intentionally avoid rewriting

- Stripe webhook confirmation path (`confirmBookingPayment`)
- Cleaner status transition validator (unless additive statuses)
- Entire `(platform)/pro` tree — prefer redirects + shared libs over parallel rewrites

---

## 9. New files required

| File / area | Purpose |
|-------------|---------|
| `supabase/migrations/00010_*.sql` … | Markets, zones, service extensions, cleaner capabilities, booking FKs, trigger fix |
| `src/lib/matching/eligibility.ts` (+ tests) | Hard gates before score |
| `src/lib/markets/` (optional thin repo layer) | DB loaders wrapping `resolveMarket` / seeded tables |
| `src/components/booking/steps/*` for service tiles / dynamic questions | Marketplace UX |
| `src/components/marketing/service-tiles.tsx` (or similar) | Homepage entry |
| Admin UI for markets/services | Ops |
| Customer review API + UI | `src/app/api/dashboard/reviews` (name TBD) + dashboard component |
| Quote-request notification path | Email/SMS when `pricingModel = quote` |
| (Optional) `docs/MARKETS.md` | Ops runbook for adding a third market — only if team wants; not required for MVP |

Marketplace agent may create some of these imminently — **rebase/integrate rather than duplicate**.

---

## 10. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Parallel agent collisions | Duplicate modules, broken imports | Single ownership: config in `src/config/*`, score in `src/lib/matching/*`; eligibility is an addition, not a fork |
| Status enum rewrite | Breaks cleaner app, RLS policies, webhooks | Prefer UI aliases; additive enums only |
| Dual catalogs (`BOOKING_SERVICES` vs `MARKETPLACE_SERVICES` vs DB `services`) | Price/service drift | One write path; legacy map via `legacyServiceType` |
| CAD vs USD | Wrong Stripe currency | Market must drive `currency` before Toronto launch |
| Service-role API mistakes | Data leaks | Checklist on every new route; prefer session client + RLS where practical |
| Cleaner signup trigger bug | Cleaners cannot access `/cleaner` | Fix trigger + backfill script before recruiting |
| Matching without eligibility | Bad assigns / unfair job list | Ship eligibility before expanding auto features |
| Quote-only without ops workflow | Stuck bookings | Admin queue + customer messaging before enabling commercial tiles in prod |
| Untracked git tree | Lost work / hard review | Commit MaidLinx baseline separately from Wingman history when ready |
| Over-building algorithms | Delay marketplace launch | Keep stubs; wire only service-area + availability + eligibility + existing score |

---

## Initial markets & multi-service (product constraints)

- **Launch markets:** Toronto / GTA (`CAD`, `America/Toronto`) and South Florida (`USD`, `America/New_York`) — already drafted in `src/config/markets.ts`.
- **Future markets:** Unlimited via new rows/config entries; **no** scattered `if (city === "Toronto")` — all resolution through markets module / DB.
- **Categories:** Residential, Deep, Move-In/Out, Airbnb/STR, Office & Commercial, Post-Construction, Event/Venue, Recurring — drafted in `src/config/services.ts`.
- **Matching:** Eligibility **before** scoring; ineligible cleaners never appear in rank results or job feed.
- **Preserve:** Guest + auth booking, Stripe deposit webhook, cleaner job ladder, admin assign, customer dashboard.

---

## PASS / PARTIAL / MISSING scorecard (honest)

| System | Verdict |
|--------|---------|
| Next.js app + design system | **PASS** |
| Supabase schema MVP + migrations 00001–00009 | **PASS** (must be applied to a project) |
| `.env.local` configured | **MISSING** (example only) |
| Customer book → pay deposit → confirm | **PASS** (code) / **REQUIRES CONFIGURATION** (env + Stripe + DB) |
| Multi-market runtime | **PARTIAL** (TS config only) |
| Multi-service marketplace UX | **PARTIAL** (TS catalog only; UI still residential wizard) |
| Dynamic questions / quote-only | **MISSING** (schema in config; not wired) |
| Admin match score suggestions | **PASS** |
| Eligibility-before-score | **MISSING** |
| Auto-matching | **MISSING** (intentional) |
| Cleaner signup → portal | **PARTIAL** (UX yes; trigger/role reliability no) |
| Cleaner availability / jobs / checklist / photos | **PASS** |
| Cleaner services & zones | **MISSING** |
| Customer tracking | **PARTIAL** |
| Customer ratings write | **MISSING** |
| Admin bookings/customers/cleaners/payments/disputes | **PASS / PARTIAL** |
| Admin markets & multi-service ops | **MISSING** |
| DB pricing as source of truth | **MISSING** (admin edits unused by quote) |
| Stripe Connect / payouts | **PARTIAL** |
| Email/SMS | **PARTIAL** (log default) |
| Algorithm stubs (eta, fraud, etc.) | **MISSING** (stubs only) |

---

## Docs already present

| Doc | Role |
|-----|------|
| `MVP.md` | Product MVP scope & status lifecycle |
| `docs/DATABASE.md` | MVP schema & migration apply notes |
| `docs/MATCHING.md` | Admin match-score formula & UX |
| `docs/ALGORITHMS.md` | Long-term algorithm map & stub contracts |
| `README.md` | Stack, env, Supabase/Stripe setup |
| This file (`docs/MAIDLINX_PLATFORM_PLAN.md`) | Platform evolution audit & phased plan |

---

## Stop line

**No platform implementation was performed for this document.** Next engineering work should continue from Phase 0–1, integrating with the in-flight marketplace agent’s `markets.ts` / `services.ts` and the existing match-score module—not replacing them.
