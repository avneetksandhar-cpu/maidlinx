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
| LAUNCH BLOCKERS (P0) | **7** |
| P1 open | 6 |
| Sections PASS (of scorecard below) | partial |

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

Agent could **not** call Stripe API from this environment (outbound authenticated Stripe call blocked). Local key prefix is `sk_test` only.

---

## Migrations: repo vs prod (`pgoyhujsfbmfshtnlbnx`)

**Applied remotely (named):** through `dispatch_live_ops_v1` + `cleaner_platform_v1` + pro foundation prereq.

| Local migration | Remote | Notes |
|-----------------|--------|-------|
| `00025` Cleaner Platform | APPLIED (as `cleaner_platform_v1`) | gates/academy/trust present |
| `00026` Dispatch Live Ops | APPLIED | `booking_offers` exists; 0 offer rows |
| `00023` Repeat revenue | **NOT applied** | `referral_codes` / `retention_events` / preferred columns may be partial |
| `00017` recurring_plans | **NOT applied** | `recurring_plans` null |
| `00027` Brain V1 | **NOT applied** | `brain_events` null — do not apply mid-gate unless needed; not required for BOOK→PAY |

No destructive resets performed this session.

---

## Remote DB snapshot (evidence)

| Fact | Value |
|------|------:|
| Bookings | 7 |
| `pending_payment` | 5 |
| `awaiting_assignment` | 1 |
| `completed` | 1 |
| Payments `succeeded` | 1 |
| `stripe_webhook_events` | 1 |
| `booking_offers` | 0 |
| Reviews | 0 |
| Cleaners | 2 (1 ACTIVE/verified; 1 APPLICANT inactive) |

**Interpretation:** Historical payment + webhook + one completed booking exist, but this gate session did **not** re-prove a fresh BOOK→PAY→WEBHOOK→OFFER→ACCEPT→COMPLETE→RATE→REBOOK chain. Offers = 0 → dispatch accept unproven. Reviews = 0 → rate unproven.

---

## Scorecard (founder §1–20)

| # | Area | Result | Evidence |
|---|------|--------|----------|
| 1 | Env audit | **PASS** | Local TEST Stripe + Supabase FOUND; no LIVE keys in `.env.local` |
| 2 | Migrations compare / safe apply | **PARTIAL** | Dispatch+Cleaner applied; retention/brain/recurring gaps remain — not applied this gate (non-blocking for core pay if unused) |
| 3 | TEST personas | **PARTIAL** | 1 active verified cleaner + 1 applicant; ID/BG stay PENDING_PROVIDER semantics; no full synthetic loop this session |
| 4 | Customer book path (mobile+desktop) | **PARTIAL** | Code + build OK; live Places historically referrer-blocked on prod; local e2e browser not re-run this session |
| 5 | Price attack | **PASS** (code) | `assertPriceMatch` tests reject mismatched client totals (`calculateQuote.test.ts`, `validate.test.ts`) |
| 6 | Stripe TEST + webhook fail/cancel/dup | **FAIL** | Keys FOUND_TEST; agent cannot hit Stripe API here; no fresh Checkout + webhook proof this session. Dup idempotency **PASS** as unit contract only |
| 7 | Cleaner security attacks | **PASS** (code) | `privilege-escalation.test.ts` + `backend-hardening.test.ts` green |
| 8 | Dispatch + race accept | **PARTIAL** | Optimistic lock + unique indexes coded/tested (`assignment.test.ts`); **0** live offers; race unproven in DB |
| 9 | Cleaner job lifecycle + illegal transitions | **PASS** (code) | Status machine + transition tests; live ARRIVE→COMPLETE not re-run |
| 10 | Customer live status | **PARTIAL** | Live status components/APIs exist; not re-proven with active EN_ROUTE job this session |
| 11 | Admin + cross-role route attacks | **PASS** (code) | Admin permission + hardening tests; live admin UI not exercised |
| 12 | Rating + rebook new server quote | **FAIL** | `reviews=0`; rebook CTA code exists; fresh quote path coded — not e2e proven |
| 13 | Mobile QA defects | **PARTIAL** | One-decision booking screens shipped; Maps prod referrer historically FAIL |
| 14 | Failure recovery / no secret leaks | **PASS** (code) | Customer-friendly config errors + hardening tests; no secrets printed this session |
| 15 | Privacy audit | **PARTIAL** | Funnel strips PII keys; legal pages placeholder history; no new invasive tracking |
| 16 | RLS / authorization | **PARTIAL** | Policies present on bookings/payments/cleaners/offers/reviews; advisor hygiene not re-run |
| 17 | Performance obvious fixes | **PASS** | No checkout-blocking Brain wiring; build OK; no perf regressions introduced |
| 18 | Observability | **FAIL** | `SENTRY_DSN` MISSING; email/SMS log-only |
| 19 | Regression lint/typecheck/tests/build | **PASS** | lint 0 errors (1 img warn); typecheck OK after Brain cast fixes; **272** tests; `npm run build` OK |
| 20 | Full lifecycle proof | **FAIL** | Missing fresh Stripe TEST BOOK→PAY→WEBHOOK→ASSIGN→ACCEPT→COMPLETE→RATE→REBOOK in this gate |

---

## P0 LAUNCH BLOCKERS (7)

1. **Fresh Stripe TEST lifecycle not proven** this session (BOOK→PAY→WEBHOOK→…→COMPLETE).  
2. **Dispatch offer→accept unproven** (`booking_offers` = 0).  
3. **Rate / review unproven** (`reviews` = 0).  
4. **Outbound Stripe API unverifiable from agent** (blocked) — human must run TEST Checkout or approve Stripe tool use.  
5. **Production Maps Places** historically referrer-blocked (see prior `PRODUCTION_READINESS.md`) — confirm still fixed or still broken.  
6. **Monitoring** — `SENTRY_DSN` MISSING.  
7. **Notifications** — providers log-only (acceptable for soft launch only if Product accepts; still a P0 for “ops-complete” launch).

---

## What passed with evidence

- Local env: Supabase + Stripe **TEST** configured; no LIVE keys.  
- Remote: cleaner platform gates + dispatch tables present; 1 historical succeeded payment + 1 webhook row + 1 completed booking.  
- Security/pricing/auth unit suites green (44 focused + 272 full).  
- Production build green on `cursor/launch-gate`.

---

## Ancestry checkpoints (brief)

- **Cleaner Platform V1:** migration applied remotely; Verified gates in code.  
- **Dispatch Live Ops:** schema applied; offers empty.  
- **Retention:** checkpoint doc only; `00023` / recurring not on remote.  
- **Brain V1:** libs+`00027` committed on tip; **not** applied to remote; not wired into checkout.

---

## HUMAN ACTION REQUIRED

**Run one Stripe TEST Checkout on local or staging:** create booking → pay with Stripe test card `4242…` → confirm `stripe_webhook_events` increments and booking leaves `pending_payment` → admin/offer → cleaner accept → complete → rate. Reply `done` when that path is evidenced (or paste non-secret booking id + webhook event type counts).

Until then: **READY TO LAUNCH: NO**.
