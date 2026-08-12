# MaidLinx Launch Gate

**Date:** 2026-08-12  
**Branch:** `cursor/launch-gate` (from `cursor/maidlinx-brain-v1` tip; includes Cleaner Platform + Dispatch schema checkpoint + Brain libs)  
**Mode:** Launch Gate — no new features; evidence only  
**Rule:** UI ≠ proven. Secrets reported FOUND / EMPTY / MISSING / INVALID only — never values.  
**HARD RULE:** `READY TO LAUNCH: YES` only if real Stripe TEST completed full BOOK→PAY→WEBHOOK→ASSIGN→ACCEPT→COMPLETE **and** all P0 security checks pass.

---

## READY TO LAUNCH: **NO**

| Metric | Count |
|--------|------:|
| LAUNCH BLOCKERS (P0) | **3** |
| P1 open | 6 |
| Sections PASS (of scorecard below) | improved |

**READY FOR FIRST TEST BOOKING: YES** (local + Stripe TEST proven this session)  
**READY FOR REAL-MONEY LAUNCH: NO** (no LIVE keys; Maps / Sentry / real notification providers still open)

---

## Env audit (names only)

| Variable | Status |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | FOUND |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | FOUND |
| `SUPABASE_SERVICE_ROLE_KEY` | FOUND |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | FOUND_TEST |
| `STRIPE_SECRET_KEY` | FOUND_TEST |
| `STRIPE_WEBHOOK_SECRET` | FOUND |
| Live Stripe keys (`sk_live_` / `pk_live_`) | NO (absent) |
| `STRIPE_CONNECT_ENABLED` | MISSING (treated as off — correct for controlled launch) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | FOUND |
| `EMAIL_PROVIDER` / `SMS_PROVIDER` | FOUND(`log`) |
| `RESEND_API_KEY` / Twilio | MISSING → notifications PENDING_PROVIDER |
| `SENTRY_DSN` | MISSING |
| `IDENTITY_PROVIDER_CONNECTED` / `BACKGROUND_PROVIDER_CONNECTED` | MISSING → PENDING_PROVIDER |

Stripe **TEST** API reachable from agent via local `sk_test` (this session). Stripe MCP account listing is LIVE-only — **do not use** for gate payments.

---

## Migrations: repo vs prod (`pgoyhujsfbmfshtnlbnx`)

**Applied remotely (named):** through `dispatch_live_ops_v1` + `cleaner_platform_v1` + pro foundation prereq.

| Local migration | Remote | Notes |
|-----------------|--------|-------|
| `00025` Cleaner Platform | APPLIED (as `cleaner_platform_v1`) | gates/academy/trust present |
| `00026` Dispatch Live Ops | APPLIED | `booking_offers` present; fresh offer created this session |
| `00023` Repeat revenue | **NOT applied** | `referral_codes` / `retention_events` / preferred columns may be partial |
| `00017` recurring_plans | **NOT applied** | `recurring_plans` null |
| `00027` Brain V1 | **NOT applied** | `brain_events` null — do not apply mid-gate unless needed; not required for BOOK→PAY |

No destructive resets performed this session.

---

## Fresh E2E evidence (this session — 2026-08-12)

Script: `scripts/launch-gate-fresh-e2e.mjs` against local `http://localhost:3001` + remote Supabase + Stripe **TEST**.

| Checkpoint | Result | Evidence (ids only) |
|------------|--------|---------------------|
| BOOK | **PASS** | booking `09893ad1-2928-4f15-bf2b-2a1affffa3ce` created `pending_payment` |
| PAY (Stripe TEST) | **PASS** | PaymentIntent `pi_3U3TPSFAmKhvpBtw2lZ9JiPu` confirmed `succeeded` (`pm_card_visa`, livemode=false) |
| WEBHOOK | **PASS** | signed `payment_intent.succeeded` → `/api/webhooks/stripe` 200; event `evt_launchgate_1786507499632` claimed |
| PAYMENT DB | **PASS** | booking → `awaiting_assignment` + `payment_status=deposit_paid`; payments row `succeeded` |
| OFFER | **PASS** | `booking_offers` `ce61a7ca-ed29-45e5-841b-82bb05a486ec` pending→accepted |
| ACCEPT / ASSIGN | **PASS** | offer accepted; `cleaner_assignments` active `source=offer_accept` |
| COMPLETE | **PASS** | booking status `completed` |
| RATE | **PASS** | review `20ec6bbc-0d17-4275-a1d9-981da0cb68c7` rating 5 |

**FULL FRESH E2E: PASS**

Code fix shipped with gate: checkout PaymentIntents set `automatic_payment_methods.allow_redirects=never` so card TEST confirm does not require redirect `return_url`.

---

## Remote DB snapshot (post fresh e2e)

Prior historical rows remain. **New** this session: booking `09893ad1-…`, webhook `evt_launchgate_1786507499632`, offer `ce61a7ca-…`, review `20ec6bbc-…`. Cleaners unchanged: 2 (1 ACTIVE/verified; 1 APPLICANT).

---

## Scorecard (founder §1–20)

| # | Area | Result | Evidence |
|---|------|--------|----------|
| 1 | Env audit | **PASS** | Local TEST Stripe + Supabase FOUND; no LIVE keys in `.env.local` |
| 2 | Migrations compare / safe apply | **PARTIAL** | Dispatch+Cleaner applied; retention/brain/recurring gaps remain — not applied this gate (non-blocking for core pay if unused) |
| 3 | TEST personas | **PASS** | Active verified cleaner used for fresh offer→accept→complete |
| 4 | Customer book path (mobile+desktop) | **PARTIAL** | API book path proven; live Places historically referrer-blocked on prod; browser UI not re-run |
| 5 | Price attack | **PASS** (code) | `assertPriceMatch` tests reject mismatched client totals |
| 6 | Stripe TEST + webhook | **PASS** | Fresh PI succeed + signed webhook claim + DB deposit_paid this session |
| 7 | Cleaner security attacks | **PASS** (code) | `privilege-escalation.test.ts` + `backend-hardening.test.ts` green |
| 8 | Dispatch + race accept | **PASS** (fresh) | Fresh offer + accept + active assignment; race still unit-covered |
| 9 | Cleaner job lifecycle | **PASS** (fresh) | assigned→accepted→on_the_way→arrived→in_progress→completed |
| 10 | Customer live status | **PARTIAL** | Live status components/APIs exist; not re-proven with active EN_ROUTE UI this session |
| 11 | Admin + cross-role route attacks | **PASS** (code) | Admin permission + hardening tests; live admin UI not exercised |
| 12 | Rating + rebook | **PARTIAL** | Fresh review inserted; rebook CTA/quote coded — one-tap rebook UI not re-browsered |
| 13 | Mobile QA defects | **PARTIAL** | One-decision booking screens shipped; Maps prod referrer historically FAIL |
| 14 | Failure recovery / no secret leaks | **PASS** (code) | Customer-friendly config errors + hardening tests; no secrets printed this session |
| 15 | Privacy audit | **PARTIAL** | Funnel strips PII keys; legal pages placeholder history; no new invasive tracking |
| 16 | RLS / authorization | **PARTIAL** | Policies present on bookings/payments/cleaners/offers/reviews; advisor hygiene not re-run |
| 17 | Performance obvious fixes | **PASS** | No checkout-blocking Brain wiring; build OK |
| 18 | Observability | **FAIL** | `SENTRY_DSN` MISSING; email/SMS log-only |
| 19 | Regression lint/typecheck/tests/build | **PASS** | Prior gate: lint/typecheck/272 tests/build OK |
| 20 | Full lifecycle proof | **PASS** | Fresh BOOK→PAY→WEBHOOK→OFFER→ACCEPT→COMPLETE→RATE this session |

---

## P0 LAUNCH BLOCKERS (3 remaining)

1. ~~Fresh Stripe TEST lifecycle not proven~~ **CLEARED** (booking `09893ad1-…`).  
2. ~~Dispatch offer→accept unproven~~ **CLEARED** (offer `ce61a7ca-…`).  
3. ~~Rate / review unproven~~ **CLEARED** (review `20ec6bbc-…`).  
4. ~~Outbound Stripe API unverifiable~~ **CLEARED** (TEST PI confirmed via `sk_test`).  
5. **Production Maps Places** historically referrer-blocked — confirm still fixed or still broken.  
6. **Monitoring** — `SENTRY_DSN` MISSING.  
7. **Notifications** — providers log-only (acceptable for soft launch only if Product accepts; still a P0 for “ops-complete” launch).

---

## What passed with evidence

- Local env: Supabase + Stripe **TEST** configured; no LIVE keys.  
- Fresh Stripe TEST lifecycle + webhook claim + offer/accept/assignment/complete/rate.  
- Checkout hardening: `allow_redirects=never` for PaymentIntents.  
- Remote: cleaner platform gates + dispatch tables present.  
- Security/pricing/auth unit suites previously green; production build previously green on `cursor/launch-gate`.

---

## Ancestry checkpoints (brief)

- **Cleaner Platform V1:** migration applied remotely; Verified gates in code.  
- **Dispatch Live Ops:** schema applied; fresh offer proven this session.  
- **Retention:** checkpoint doc only; `00023` / recurring not on remote.  
- **Brain V1:** libs+`00027` committed on tip; **not** applied to remote; not wired into checkout.

---

## HUMAN ACTION REQUIRED

**Confirm production Google Maps Places referrer restrictions** (HTTP referrer for browser key / API restrictions) so autocomplete works on the live domain — or document that manual address entry is the accepted launch path.

Until Maps + Sentry + notification-provider decisions clear: **READY TO LAUNCH (real money): NO**.
