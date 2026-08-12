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

## Fresh E2E evidence (this session — 2026-08-12T04:15Z)

Script: `scripts/launch-gate-fresh-e2e.mjs` against local `http://localhost:3001` + remote Supabase + Stripe **TEST**.

| Checkpoint | Result | Evidence (ids only) |
|------------|--------|---------------------|
| BOOK | **PASS** | booking `647edc22-831f-497e-a160-bf202229adbd` created `pending_payment` |
| PAY (Stripe TEST) | **PASS** | PaymentIntent `pi_3U3TZZFAmKhvpBtw0HOlZE7i` confirmed `succeeded` (`pm_card_visa`, livemode=false) |
| WEBHOOK | **PASS** | signed `payment_intent.succeeded` → `/api/webhooks/stripe` 200; event `evt_launchgate_1786508127241` claimed |
| PAYMENT DB | **PASS** | booking → `awaiting_assignment` + `payment_status=deposit_paid`; payments row `succeeded` |
| CLEANER GATES | **PASS** | TEST cleaner `ba902d50-…` ACTIVE / maidlinx_verified / identity verified / background clear |
| OFFER | **PASS** | `booking_offers` `579348aa-0c62-46ad-8647-8c351bff5387` pending→accepted |
| ACCEPT / ASSIGN | **PASS** | offer accepted; `cleaner_assignments` active `source=offer_accept` |
| COMPLETE | **PASS** | booking status `completed` |
| CUSTOMER STATUS | **PASS** | GET `/api/bookings/{id}` with access token → `status=completed` |
| ADMIN STATUS | **PASS** | service-role admin fields: completed + deposit_paid + active assignment |
| RATE | **PASS** | review `b8464f01-fd06-47e5-8d50-719a3b133d16` rating 5 |

**FULL FRESH E2E: PASS**

Prior same-day booking `09893ad1-…` is historical only; this session proves a new lifecycle with customer + admin status checks.

---

## Remote DB snapshot (post fresh e2e)

**New** this session: booking `647edc22-…`, PI `pi_3U3TZZFAmKhvpBtw0HOlZE7i`, webhook `evt_launchgate_1786508127241`, offer `579348aa-…`, review `b8464f01-…`. Cleaners unchanged: 2 (1 ACTIVE/verified TEST; 1 APPLICANT).

---

## Scorecard (founder §1–20)

| # | Area | Result | Evidence |
|---|------|--------|----------|
| 1 | Env audit | **PASS** | Local TEST Stripe + Supabase FOUND; no LIVE keys in `.env.local` |
| 2 | Migrations compare / safe apply | **PARTIAL** | Dispatch+Cleaner applied; retention/brain/recurring gaps remain — not applied this gate (non-blocking for core pay if unused) |
| 3 | TEST personas | **PASS** | Active verified cleaner gate-checked before fresh offer→accept→complete |
| 4 | Customer book path (mobile+desktop) | **PARTIAL** | API book path proven; live Places historically referrer-blocked on prod; browser UI not re-run |
| 5 | Price attack | **PASS** (code) | `assertPriceMatch` tests reject mismatched client totals |
| 6 | Stripe TEST + webhook | **PASS** | Fresh PI succeed + signed webhook claim + DB deposit_paid this session |
| 7 | Cleaner security attacks | **PASS** (code) | `privilege-escalation.test.ts` + `backend-hardening.test.ts` green |
| 8 | Dispatch + race accept | **PASS** (fresh) | Fresh offer + accept + active assignment; race still unit-covered |
| 9 | Cleaner job lifecycle | **PASS** (fresh) | assigned→accepted→on_the_way→arrived→in_progress→completed |
| 10 | Customer live status | **PASS** (API) | Customer booking GET returns `completed` with access token this session |
| 11 | Admin + cross-role route attacks | **PASS** (data+code) | Admin-visible booking/payment/assignment fields correct this session; permission tests previously green |
| 12 | Rating + rebook | **PARTIAL** | Fresh review inserted; rebook CTA/quote coded — one-tap rebook UI not re-browsered |
| 13 | Mobile QA defects | **PARTIAL** | One-decision booking screens shipped; Maps prod referrer historically FAIL |
| 14 | Failure recovery / no secret leaks | **PASS** (code) | Customer-friendly config errors + hardening tests; no secrets printed this session |
| 15 | Privacy audit | **PARTIAL** | Funnel strips PII keys; legal pages placeholder history; no new invasive tracking |
| 16 | RLS / authorization | **PARTIAL** | Policies present on bookings/payments/cleaners/offers/reviews; advisor hygiene not re-run |
| 17 | Performance obvious fixes | **PASS** | No checkout-blocking Brain wiring; build OK |
| 18 | Observability | **FAIL** | `SENTRY_DSN` MISSING; email/SMS log-only |
| 19 | Regression lint/typecheck/tests/build | **PASS** | Prior gate: lint/typecheck/272 tests/build OK |
| 20 | Full lifecycle proof | **PASS** | Fresh BOOK→PAY→WEBHOOK→OFFER→ACCEPT→ASSIGN→COMPLETE→CUSTOMER/ADMIN STATUS→RATE this session |

---

## P0 LAUNCH BLOCKERS (3 remaining) — dependency order

1. **Production Maps Places referrer restrictions** — blocks reliable customer address autocomplete on live domain (manual address may be accepted soft path). Depends on Google Cloud Console key restrictions.  
2. **Monitoring — `SENTRY_DSN` MISSING** — no production error visibility before real money. Depends on Sentry project + DSN in env (Vercel/local).  
3. **Notifications — providers log-only** — Resend/Twilio MISSING; ops cannot email/SMS customers/cleaners. Depends on provider signup + keys; Product may accept soft-launch with log-only.

Cleared earlier / this session (not counted in remaining 3):

- ~~Fresh Stripe TEST lifecycle~~ **CLEARED** (booking `647edc22-…`).  
- ~~Dispatch offer→accept~~ **CLEARED** (offer `579348aa-…`).  
- ~~Customer + admin status~~ **CLEARED** (API + admin fields).  
- ~~Rate / review~~ **CLEARED** (review `b8464f01-…`).  
- ~~Outbound Stripe TEST API~~ **CLEARED** (`sk_test` PI confirmed).

---

## What passed with evidence

- Local env: Supabase + Stripe **TEST** configured; no LIVE keys.  
- Fresh Stripe TEST lifecycle + webhook claim + gate-eligible offer/accept/assignment/complete + customer/admin status + rate.  
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
