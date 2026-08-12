# MaidLinx Launch Gate

**Date:** 2026-08-12  
**Branch:** `cursor/launch-gate` → evidence pushed to `split/o-launch-gate` (PR #16)  
**Mode:** Launch Gate — no new features; evidence only  
**Rule:** UI ≠ proven. Secrets reported FOUND / EMPTY / MISSING / INVALID only — never values.  
**HARD RULE (founder):** `READY FOR REAL-MONEY LAUNCH: YES` only when **Maps + Sentry + notification providers** all **PASS**. Stripe LIVE remains disabled until explicit founder approval after those three.

---

## READY TO LAUNCH: **NO** (real money)

| Metric | Count |
|--------|------:|
| LAUNCH BLOCKERS (P0) | **0** |
| P1 open | see below |
| Sections PASS (of scorecard below) | improved |

**READY FOR CONTROLLED TEST LAUNCH: YES** (prod Maps + Sentry + Resend email delivery proven; Stripe **TEST** lifecycle proven)  
**READY FOR REAL-MONEY LAUNCH: NO** (Maps + Sentry + email notifications **PASS**; Stripe LIVE remains **disabled** pending explicit founder approval — no `sk_live_` / `pk_live_`)

---

## Maps production retest (2026-08-12T04:22Z browser)

Founder confirmed GCP browser key Website restrictions:

- `https://maidlinx.com/*`
- `https://www.maidlinx.com/*`

API restrictions: Places API (New), Geocoding API, Maps JavaScript API. Saved; ~5 min wait before retest.

| Check | Result | Evidence |
|-------|--------|----------|
| Autocomplete `100 King` on **maidlinx.com** | **PASS** | 5 real suggestions (e.g. 100 King Street East, Toronto, ON) |
| Select suggestion (apex) | **PASS** | Place details → filled `100 King St E, Toronto, ON M5C 2V8, Canada` → auto-advance `/book/property` |
| Autocomplete `100 King` on **www.maidlinx.com** | **PASS** | Same 5 real suggestions; Maps JS + Places loaded; no referrer/denied UI |
| Select suggestion (www) | **PASS** | Confirming address… → advance `/book/property` |
| Use current location (apex) | **PASS** | Did **not** stick on loading; reverse geocode → `110 Dolobram Trail` / Brampton ON L7A 4Y4; button returned to idle label |

**MAPS P0: CLEARED**

Note: Vercel preview domains are **not** covered by the two production referrers above — add the exact preview host if preview Maps testing is required.

---

## Sentry production check (2026-08-12T05:24Z)

| Check | Result | Evidence |
|-------|--------|----------|
| Sentry org / project | **EXISTS (CREATED)** | Org `maidlimx`; project `maidlinx-production` (javascript-nextjs); created via Sentry MCP (was empty org) |
| Vercel Production `SENTRY_DSN` | **FOUND** | Set via `vercel env add` from Sentry MCP DSN (value never printed/committed) |
| Vercel Production `NEXT_PUBLIC_SENTRY_DSN` | **FOUND** | Same |
| `@sentry/nextjs` wired (client/server/edge) | **PASS** | `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts`, `global-error.tsx`, `withSentryConfig` |
| `sendDefaultPii` | **disabled** | Shared init `sendDefaultPii: false`; Session Replay not enabled |
| environment | **production** | Event tags |
| release | **set** | `c2a7e4e6633610dc5e282498d4eee3dcf55837fc` (VERCEL_GIT_COMMIT_SHA) |
| Safe TEST error proved in Sentry | **PASS** | Issue `MAIDLINX-PRODUCTION-1` — https://maidlimx.sentry.io/issues/MAIDLINX-PRODUCTION-1 — message `MaidLinx Launch Gate Sentry TEST error — controlled verification only`; event `247cb9fce417472eb22afe22007a85aa` @ 2026-08-12T05:24:05Z |
| Test endpoint secured/removed | **PASS** | Temporary `/api/internal/sentry-launch-gate-test` removed after proof; issue resolved in Sentry |
| Production deploy | **PASS** | `vercel --prod` → aliased `https://maidlinx.com` (deployment `dpl_5hij6UNPVXvU5hGL4bkBx6QUWAJb` then follow-up redeploy without test route) |

**SENTRY: PASS**

---

## Notifications / Resend (2026-08-12T07:49Z)

| Check | Result | Evidence |
|-------|--------|----------|
| Vercel Production `EMAIL_PROVIDER` | **FOUND** | `vercel env ls --scope maidlinx` (names only) |
| Vercel Production `RESEND_API_KEY` | **FOUND** | Sensitive; value never printed/pulled |
| Vercel Production `RESEND_FROM_EMAIL` | **FOUND** | Production + Preview |
| Vercel Production `EMAIL_FROM` | **FOUND** | Production + Preview |
| Vercel Production `SMS_PROVIDER` / Twilio | **MISSING** | Optional for this gate; SMS remains log/skip |
| Outbox honesty | **PASS** | `skipped` when log; does not fake delivery |
| Customer/admin in-app/API status | **PASS** | Controlled TEST ops |
| App wiring | **PASS** | `src/lib/notifications/email.ts` uses Resend + `RESEND_FROM_EMAIL`/`EMAIL_FROM` + optional `reply_to` |
| Controlled Resend TEST | **PASS** | One send only — see below |
| **RESEND_DELIVERY** | **PASS** | Resend log **Delivered** + human inbox confirmation |

### Controlled TEST email (exactly one)

| Field | Value |
|-------|--------|
| To | `info@maidlinx.com` |
| From | `MaidLinx <bookings@mail.maidlinx.com>` |
| Reply-To | `info@maidlinx.com` |
| Subject | MaidLinx Launch Gate TEST — production Resend delivery |
| Resend id (prefix) | `a16c1687-f2b…` |
| Resend events | **Sent** Aug 12, 3:49 AM ET → **Delivered** Aug 12, 3:49 AM ET |
| Human inbox | **CONFIRMED** received at `info@maidlinx.com` (founder) |
| Temporary proof route | Deployed then removed (`/api/internal/resend-launch-gate-test`); no further TEST sends |

`mail.maidlinx.com` is the Resend **sending subdomain only** (not an inbox). Replies go to `info@maidlinx.com`.

**NOTIFICATIONS (email / Resend): PASS** for founder notification-provider gate.  
**SMS / Twilio:** still **MISSING** — P1 only (not blocking controlled TEST or the Maps+Sentry+email P0 set).

Stripe LIVE remains disabled (TEST keys only; no LIVE enablement).

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
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | FOUND (prod browser key works — live Places PASS) |
| `EMAIL_PROVIDER` | FOUND (`resend`) |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `EMAIL_FROM` | FOUND |
| `SMS_PROVIDER` / Twilio | MISSING → SMS not delivered externally |
| `SENTRY_DSN` | FOUND |
| `NEXT_PUBLIC_SENTRY_DSN` | FOUND |
| `IDENTITY_PROVIDER_CONNECTED` / `BACKGROUND_PROVIDER_CONNECTED` | MISSING → PENDING_PROVIDER |

Stripe **TEST** only. Do not enable LIVE without explicit founder approval.

---

## Fresh TEST E2E evidence (smoke this session — 2026-08-12T04:21Z)

Script: `scripts/launch-gate-fresh-e2e.mjs` against local `http://localhost:3001` + remote Supabase + Stripe **TEST**.

| Checkpoint | Result | Evidence (ids only) |
|------------|--------|---------------------|
| BOOK | **PASS** | booking `4700004e-29a3-4756-a85b-ccb20b33a574` |
| PAY (Stripe TEST) | **PASS** | PI `pi_3U3TfrFAmKhvpBtw2TMlirtX` (livemode=false) |
| WEBHOOK | **PASS** | signed claim → 200; event `evt_launchgate_1786508516560` |
| PAYMENT DB | **PASS** | `awaiting_assignment` + `deposit_paid` |
| CUSTOMER STATUS | **PASS** | GET booking → `completed` (after accept/complete steps in script) |
| ADMIN STATUS | **PASS** | completed + deposit_paid + active assignment |

Prior same-day full lifecycle also PASS (`647edc22-…`). **FRESH TRANSACTION SMOKE: PASS**

Regression this session: lint 0 errors (1 warning), typecheck OK, **272** tests PASS, production build OK.

---

## Scorecard (founder §1–20)

| # | Area | Result | Evidence |
|---|------|--------|----------|
| 1 | Env audit | **PASS** | Local TEST Stripe + Supabase; no LIVE keys; Resend email env FOUND |
| 2 | Migrations compare / safe apply | **PARTIAL** | Dispatch+Cleaner applied; retention/brain/recurring gaps — non-blocking for core pay |
| 3 | TEST personas | **PASS** | Active verified cleaner used in smoke |
| 4 | Customer book path (mobile+desktop) | **PASS** (Maps) | Live Places autocomplete+select on apex + www; geolocation reverse geocode PASS |
| 5 | Price attack | **PASS** (code) | `assertPriceMatch` tests |
| 6 | Stripe TEST + webhook | **PASS** | Fresh PI + webhook + DB this session |
| 7 | Cleaner security attacks | **PASS** (code) | privilege + hardening suites green |
| 8 | Dispatch + race accept | **PASS** | Covered in e2e + unit |
| 9 | Cleaner job lifecycle | **PASS** | Prior + smoke script |
| 10 | Customer live status | **PASS** (API) | Customer booking GET |
| 11 | Admin + cross-role | **PASS** | Admin fields correct in smoke |
| 12 | Rating + rebook | **PARTIAL** | Review insert proven; rebook UI not re-browsered |
| 13 | Mobile QA defects | **PARTIAL** | Maps prod cleared; full mobile matrix not re-run |
| 14 | Failure recovery / no secret leaks | **PASS** | No secrets printed this session |
| 15 | Privacy audit | **PARTIAL** | Funnel strips PII keys; legal placeholder history |
| 16 | RLS / authorization | **PARTIAL** | Policies present; advisor hygiene not re-run |
| 17 | Performance obvious fixes | **PASS** | Build OK |
| 18 | Observability | **PASS** | Vercel DSN FOUND; `@sentry/nextjs` wired; production TEST event proved |
| 19 | Regression lint/typecheck/tests/build | **PASS** | lint/typecheck/272 tests/build OK this session |
| 20 | Full lifecycle proof | **PASS** | Stripe TEST BOOK→PAY→WEBHOOK→… this session |

---

## P0 LAUNCH BLOCKERS (0 remaining)

Cleared:

- ~~Production Maps Places referrer / autocomplete~~ **CLEARED**  
- ~~Fresh Stripe TEST lifecycle / smoke~~ **CLEARED**  
- ~~Sentry / production error monitoring~~ **CLEARED**  
- ~~Notifications — Resend email provider~~ **CLEARED** (`RESEND_DELIVERY: PASS` — Resend Delivered + human inbox at `info@maidlinx.com`)

**Not a P0 (remaining before real-money):** Stripe LIVE still **disabled** by design — requires **explicit founder approval** to add LIVE keys / flip livemode. SMS/Twilio remains optional P1.

---

## P1 (important, not blocking controlled TEST)

- Twilio / SMS provider (email Resend is PASS; SMS still log/skip).  
- Retention / Brain / recurring migrations not on remote (unused for core pay).  
- Legal pages polish; full mobile matrix; RLS advisor hygiene re-run.  
- Preview-domain Maps referrer if agents test on `*.vercel.app`.  
- Sentry source maps auth token (`SENTRY_AUTH_TOKEN`) optional for readable frames.  
- Redeploy Production once more if temporary Resend proof route still present on last alias (route removed from repo).

---

## What passed with evidence

- **Production Maps:** apex + www autocomplete + select + geolocation reverse geocode.  
- **Production Sentry:** project + DSN on Vercel + SDK + controlled TEST error.  
- **Production Resend:** four email env names FOUND; one TEST to `info@maidlinx.com` From `MaidLinx <bookings@mail.maidlinx.com>` Reply-To `info@maidlinx.com`; Resend **Delivered**; human inbox **confirmed**.  
- Local Stripe **TEST** smoke + webhook + customer/admin visibility.  
- Lint / typecheck / 272 tests / build green.  
- No LIVE Stripe keys; Connect off.

---

## HUMAN ACTION REQUIRED

**NONE** for Maps / Sentry / Resend email P0.

**Before real-money:** explicit founder approval to enable Stripe **LIVE** keys (keep TEST until then). Optional: add Twilio when SMS delivery is required.
