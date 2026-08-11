# MaidLinx — Full Launch Report

**Date:** 2026-08-11  
**Branch:** `cursor/live-location-and-booking-ux`  
**Synthesized from:** `PRODUCTION_READINESS.md`, `LAUNCH_AUDIT.md`, `END_TO_END_TEST.md`, `REPEAT_REVENUE_TEST.md`, `CURRENT_SPRINT.md`, git log  
**Rule:** UI ≠ proven. No secrets. No invented metrics.

---

## 1. Executive verdict

| Gate | Verdict |
|------|---------|
| **READY FOR CONTROLLED REAL-MONEY LAUNCH** | **NO** |
| **READY FOR FIRST TEST BOOKING** | **NO** |

**Why:** Production cannot persist bookings (`POST /api/bookings` → `503 SUPABASE_NOT_CONFIGURED`). Production Places Autocomplete is referrer-blocked. Local Stripe TEST keys and `SUPABASE_SERVICE_ROLE_KEY` are EMPTY. Remote cleaner supply is **0**. Stripe payments and webhooks have never been proven end-to-end (`payments` = 0, `stripe_webhook_events` = 0). Cancellation/refund policy is unimplemented as a Product decision. Legal pages are placeholders only.

**What is ready:** Code quality (lint / typecheck / **242** tests / production build PASS). Auth + RLS foundations. Server-authoritative pricing. Honest trust copy. Repeat-booking UX foundations (Book again, promos, referrals architecture — credits/auto-charge off). Connect payouts correctly stubbed.

**Do not** take a stranger’s card until P0 blockers below are cleared and one full **BOOK → PAY → ASSIGN → CLEAN → COMPLETE** loop is proven (production or Stripe TEST against production DB) with ≥1 approved active cleaner.

---

## 2. P0 blockers — exact human actions (ONE at a time)

Do these in order. Do not skip ahead. Never paste secrets into chat or git.

### P0-1 — Google Places / Maps referrer allowlist (production)

**Where:** Google Cloud Console → project `maidlinx-505202` → APIs & Services → Credentials → Maps **browser** API key  

**Action:** Application restrictions → HTTP referrers — add:

- `https://maidlinx.com/*`
- `https://www.maidlinx.com/*`
- Keep localhost: `http://localhost:3001/*`, `http://127.0.0.1:3001/*`

Ensure **Places API (New)**, **Maps JavaScript API**, and **Geocoding API** are enabled/allowed for that key. Save.

**Prove:** Hard-refresh `https://maidlinx.com/book/address` → type `100 King` → real suggestions with place id + coords on select. Current location should reverse-geocode after browser permission.

**Evidence of fail:** CDP — `Requests from referer https://maidlinx.com/ are blocked.` Manual address entry still works as fallback.

---

### P0-2 — Production Supabase service role on Vercel

**Where:** Vercel project for maidlinx.com → Environment Variables  

**Action:** Set `SUPABASE_SERVICE_ROLE_KEY` to the Supabase project **service_role** secret (Dashboard → Project Settings → API — not the anon key). Redeploy.

**Prove:** `POST https://maidlinx.com/api/bookings` no longer returns `503` / `SUPABASE_NOT_CONFIGURED`.

**Also for local first test booking:** Paste the same key into project-root `.env.local` only → restart `npm run dev`.

---

### P0-3 — Stripe TEST deposit + webhook proof

**Where:** Stripe Dashboard (Test mode) + Vercel env + local `.env.local`  

**Action:** Set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (TEST only: `pk_test_` / `sk_test_`). Configure webhook endpoint for `/api/webhooks/stripe`. Locally use `stripe listen` per `docs/STRIPE_SETUP.md`.

**Prove:** One sandbox deposit → `payments` row → webhook claim in `stripe_webhook_events` → booking `awaiting_assignment` / `deposit_paid`.

**Do not** switch to live keys until this loop is proven and Product explicitly approves.

---

### P0-4 — Seed ≥1 approved active cleaner

**Where:** Supabase / admin UI per `SETUP_TODAY.md` / `scripts/SEED_TEST_USERS.md`  

**Action:** Create cleaner user + `cleaners` row with `approved=true` and `is_active=true`.

**Prove:** Admin assign succeeds (assign API rejects non-approved/inactive). Cleaner can run status ladder to complete.

**Remote today:** `cleaners` = **0**.

---

### P0-5 — Cancellation / refund business decision

**Where:** Product / founder → record in `company/DECISIONS.md`  

**Action:** Accept or change code’s ≥24h full deposit refund assumption before real money.

**Status:** **BUSINESS DECISION REQUIRED** — not in `DECISIONS.md` yet.

---

### P0-6 — Legal counsel replaces placeholders

**Where:** `/legal/privacy`, `/legal/terms`, `/legal/cleaner-agreement`  

**Action:** Counsel replaces placeholder pages (shipped to stop production 404s; banners say **LEGAL REVIEW REQUIRED**).

**Do not** treat placeholders as binding for real-money customers.

---

## 3. Consolidated PASS / FAIL tables

### 3A — Systems (production readiness + launch audit merge)

| System | Result | Sources |
|--------|--------|---------|
| Customer booking persist (prod) | **FAIL** | LAUNCH_AUDIT, PRODUCTION_READINESS — `503 SUPABASE_NOT_CONFIGURED` |
| Customer booking UI / funnel code | **PASS** (code) | CURRENT_SPRINT, E2E |
| Google Places Autocomplete (prod) | **FAIL** | LAUNCH_AUDIT, PRODUCTION_READINESS — referrer blocked |
| Current location (prod) | **FAIL** | Same Maps/Geocode gate |
| Auth / roles | **PASS** (code) | All — leaked-password protection off = P1 |
| Supabase project health | **PASS** | ACTIVE_HEALTHY; markets 2 / zones 6 / bookings 1 |
| RLS / security foundations | **PASS** / **PARTIAL** | Core RLS on; advisor WARNs = P1 |
| Price security | **PASS** (code) | `calculateBookingPrice` + `assertPriceMatch` + tests |
| Stripe TEST checkout | **FAIL** | Keys EMPTY; payments = 0 |
| Stripe webhooks idempotency | **PARTIAL** | Coded + table exists; 0 events |
| Stripe Connect | **PASS** (controlled) | Stub unless `STRIPE_CONNECT_ENABLED=true` |
| Cancellation / refund policy | **FAIL** | Code present; Product decision missing |
| Cleaner supply / assign proof | **FAIL** | cleaners = 0 |
| Cleaner lifecycle code | **PASS** (code) / **FAIL** (ops) | Transitions tested; unproven live |
| Admin / dispatch | **FAIL** (ops) | Coded; needs paid booking + cleaner |
| Real-time / live GPS | **FAIL** | Coded; unproven on live job |
| Notifications | **FAIL** | Providers = `log`; Resend/Twilio MISSING |
| Monitoring | **FAIL** | `SENTRY_DSN` MISSING |
| Backup / PITR | **FAIL** | Not verified — do not claim |
| Legal pages | **FAIL** | Placeholders only |
| Trust claims | **PASS** | Honest markets, deposit/balance, no fake ratings |
| Mobile critical path | **PASS** / **PARTIAL** | One-screen booking coded; Maps blocks live Maps proof |
| Production build | **PASS** | lint 0 errors, typecheck, 242 tests, build OK |
| Controlled real-money launch | **FAIL** | PRODUCTION_READINESS §27 |

### 3B — End-to-end critical path

| Checkpoint | Result |
|------------|--------|
| Address autocomplete | **FAIL** (prod referrer; local unproven) |
| Current location | **FAIL** |
| Price calculation | **PASS** (code) |
| Customer auth | **PASS** (code) |
| Booking storage | **FAIL** (service role EMPTY local + prod) |
| Stripe test payment | **FAIL** |
| Stripe webhook | **FAIL** (unproven) |
| Admin receives booking | **FAIL** |
| Cleaner assignment | **FAIL** (0 cleaners) |
| Cleaner accept → complete ladder | **FAIL** |
| Customer tracking dashboard | **FAIL** (unproven) |
| Job completion / earnings / review | **FAIL** (unproven) |
| RLS / no client secrets | **PASS** (code / scan) |
| Mobile 390px | **PASS** (code / prior audit) |
| **READY FOR FIRST TEST BOOKING** | **NO** |

### 3C — Repeat revenue foundations

| Checkpoint | Result |
|------------|--------|
| Book again + prefill | **PASS** (code) |
| Saved places | **PASS** (code) |
| Recurring cleaning | **FAIL** (honest partial — UI only; no Stripe Subscriptions / auto-charge) |
| Booking recovery draft | **PASS** (code) |
| Promo foundation | **PASS** (code) |
| Referral foundation | **PASS** (arch) — `REFERRAL_CREDITS_LIVE=false` |
| Reviews (verified completed only) | **PASS** (code) |
| Favorite / preferred Pro (soft) | **PASS** (code) |
| Analytics funnel events | **PASS** (code) |
| Admin revenue dashboard | **PASS** (code) |
| Mobile repeat booking UX | **PASS** (code) |
| Build | **PASS** (242 tests) |
| **Repeat path live e2e** | **NO** (env blocks create/pay/complete) |

### 3D — Remote DB snapshot (as of audits)

| Relation | Count |
|----------|------:|
| cleaners (all / approved+active) | 0 / 0 |
| bookings | 1 (`awaiting_assignment`) |
| payments | 0 |
| stripe_webhook_events | 0 |
| markets / service_zones | 2 / 6 |

### 3E — Local env (names only)

| Variable | State |
|----------|-------|
| Supabase URL / anon | FOUND |
| `SUPABASE_SERVICE_ROLE_KEY` | EMPTY ← stop |
| Stripe publishable / secret / webhook | EMPTY |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | FOUND |
| Email/SMS providers | `log` |
| Resend / Twilio / Sentry | MISSING |
| `STRIPE_CONNECT_ENABLED` | MISSING (stub — OK for controlled launch) |

---

## 4. What was shipped recently (branch commits)

Recent commits on `cursor/live-location-and-booking-ux` (newest first):

| Commit | Summary |
|--------|---------|
| `467db6d` | Document production readiness gate and harden launch blockers (legal placeholders, address false out-of-area, `.env.example`) |
| `3845d6c` | Ship repeat-revenue foundations without activating credits or Stripe auto-charge |
| `13d5dc2` | Refresh launch audit with production Places and booking evidence |
| `c968d6e` | Improve rebook / repeat-booking UX (prefill, soft pro preference) |
| `62ae1ad` | Require approved cleaners on assign; pending payouts on complete |
| `67bfa55` | Document E2E test gate; wire completed-booking reviews |
| `9bcca74` | Clarify deposit vs post-job balance; add launch audit |
| `351cbba` | Tighten booking UX; correct launch trust copy |
| `fc90e63` | Document post-booking verification PASS/FAIL evidence |
| `272c136` | Post-booking customer dashboard |
| `9b90f6b` | Customer booking shell redesign; map preview fixes |
| `05d3c02` | Migrate address autocomplete to Places API (New) + reverse-geocode fallbacks |
| `e1b7ec3` | Cleaner live location tracking + booking map UX |
| Earlier | Homepage conversion, MVP Customer/Pro/Admin foundation, company board, SEO planning docs (planning only — not sprint scope) |

**Quality bar this wave:** `lint` 0 errors · `typecheck` OK · **242**/242 tests · `npm run build` OK.

---

## 5. Security / Stripe / Maps / Supabase status

### Security

- No service-role or Stripe secrets observed in client bundles / tracked tree this audit wave.
- `.env*` gitignored; secret scan: **no rotation required** from tracked content.
- Core tables RLS enabled; empty-policy tables mostly default-deny (INFO).
- **P1:** leaked-password protection off; `is_admin` SECURITY DEFINER callable by authenticated; admin permissions fail-open when empty; backup/PITR unverified.

### Stripe

- Deposit Checkout + webhook signature verify + idempotent `claimStripeWebhookEvent` **coded**.
- **Unproven live:** keys EMPTY locally; remote payments/events = 0.
- Connect **correctly stubbed** for controlled launch (`STRIPE_CONNECT_ENABLED` off).
- Remaining balance auto-charge **not** implemented — copy correctly says support settles (honest).
- Cancel/refund path coded (≥24h) — **needs Product decision** before real money.
- Live keys: **forbidden** until TEST loop proven + explicit human approval.

### Maps / Places

- Production: Maps JS + Places library **load**; Autocomplete **referrer-blocked** for `https://maidlinx.com/`.
- Local key FOUND; manual address fallback works.
- Fix is Google Cloud HTTP referrer allowlist + API enablement (human-only) — see P0-1.
- Docs: `docs/GOOGLE_MAPS_SETUP.md` (project `maidlinx-505202`).

### Supabase

- Project `pgoyhujsfbmfshtnlbnx` **ACTIVE_HEALTHY**.
- Schema/migrations in place for marketplace statuses, markets/zones, webhook events, payouts ledger, repeat-revenue foundation (`00023`).
- Production + local booking create blocked without `SUPABASE_SERVICE_ROLE_KEY`.
- Advisors: leaked password WARN; SECURITY DEFINER / `search_path` hygiene = P1/P2.

---

## 6. P1 and P2 backlog (brief)

### P1

1. Notifications still `log` — set Resend/Twilio before unattended launch  
2. `SENTRY_DSN` / monitoring provider  
3. Enable Supabase leaked-password protection  
4. Tighten `is_admin` EXECUTE grants  
5. Admin permissions fail-open when `admin_permissions` empty  
6. Prove Realtime / live GPS on a real en-route job  
7. Automatic remaining-balance charge (or keep support-settled model deliberately)  
8. Verify document Supabase backup / PITR  
9. Auth email rate-limit previously blocked signup (ops awareness)  
10. Empty-policy RLS table hygiene before any client exposure  

### P2

1. Stripe Connect live payouts productization  
2. Push notifications  
3. Function `search_path` mutable warnings  
4. Auto-dispatch / matching V2+  
5. Lighthouse / full a11y pass  
6. Recurring occurrence generation / Stripe Subscriptions  
7. Live referral credits (`REFERRAL_CREDITS_LIVE`) — Product + accounting gate  

---

## 7. Exact next 3–5 actions for the human

**Do one at a time, in this order:**

1. **Fix Google Maps HTTP referrers** for `https://maidlinx.com/*` and `https://www.maidlinx.com/*` on the browser key in project `maidlinx-505202`; prove `100 King` suggestions on production `/book/address`.
2. **Set `SUPABASE_SERVICE_ROLE_KEY`** on Vercel (redeploy) **and** in local `.env.local` (restart `npm run dev`); prove booking create succeeds (no `SUPABASE_NOT_CONFIGURED`).
3. **Add Stripe TEST keys** (local + Vercel) + webhook; complete **one** sandbox deposit → confirm payment row + webhook event + `awaiting_assignment`.
4. **Create and approve ≥1 active cleaner**; admin-assign the paid test booking; run cleaner status ladder through complete.
5. **Record cancel/refund decision** in `DECISIONS.md` and schedule legal counsel to replace `/legal/*` placeholders before any real-money stranger.

After 1–4: first test booking path can flip toward YES. After 1–5 (+ monitoring/backups awareness): re-run production readiness for controlled real-money reconsideration — still require explicit approval before live Stripe keys.

---

## Source docs

| Doc | Role |
|-----|------|
| `company/PRODUCTION_READINESS.md` | QA + Security launch gate (authoritative for real-money NO) |
| `company/LAUNCH_AUDIT.md` | Production browser + systems audit |
| `company/END_TO_END_TEST.md` | First test booking gate |
| `company/REPEAT_REVENUE_TEST.md` | Repeat / retention foundations |
| `company/CURRENT_SPRINT.md` | Sprint CRITICAL checklist (~40% e2e verified) |

---

## Sign-off

**READY FOR CONTROLLED REAL-MONEY LAUNCH: NO**  
**READY FOR FIRST TEST BOOKING: NO**

Code is substantially ahead of env/ops proof. The bottleneck is human configuration (Maps referrers, service role, Stripe TEST, cleaner supply, policy/legal) — not a missing redesign.
