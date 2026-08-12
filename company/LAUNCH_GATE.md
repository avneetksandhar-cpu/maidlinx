# MaidLinx Launch Gate

**Date:** 2026-08-12  
**Branch:** `cursor/launch-gate`  
**Mode:** Launch Gate — no new features; evidence only  
**Rule:** UI ≠ proven. Secrets reported FOUND / EMPTY / MISSING / INVALID only — never values.  
**HARD RULE (founder):** `READY FOR REAL-MONEY LAUNCH: YES` only when **Maps + Sentry + notification providers** all **PASS**. Stripe LIVE remains disabled until explicit founder approval after those three.

---

## READY TO LAUNCH: **NO** (real money)

| Metric | Count |
|--------|------:|
| LAUNCH BLOCKERS (P0) | **2** |
| P1 open | see below |
| Sections PASS (of scorecard below) | improved |

**READY FOR CONTROLLED TEST LAUNCH: YES** (prod Maps proven + Stripe TEST lifecycle proven; notifications use honest log/skip fallback)  
**READY FOR REAL-MONEY LAUNCH: NO** (Sentry + notification providers still FAIL; no LIVE keys)

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

## Sentry production check (2026-08-12T04:42Z)

| Check | Result |
|-------|--------|
| Vercel Production `SENTRY_DSN` | **MISSING** |
| Vercel Production `NEXT_PUBLIC_SENTRY_DSN` | **MISSING** |
| Preview targets (same names) | **MISSING** |
| `@sentry/nextjs` wired (not stub) | **NO** — blocked until DSN FOUND |
| Safe TEST error proved in Sentry | **NO** |

Founder indicated project `maidlinx-production` (Next.js) and intent to set both DSN vars — **not present** on Vercel Production/Preview as of this CLI audit (`vercel env ls`). No DSN values printed. No auth token required for runtime capture; do not add Stripe changes.

**SENTRY: FAIL** — STOP pending human DSN add + redeploy, then Lead Engineer wires SDK + proves one safe TEST error.

---

## Notifications (2026-08-12T04:42Z)

| Check | Result |
|-------|--------|
| Vercel Production `EMAIL_PROVIDER` / `SMS_PROVIDER` | **MISSING** (app defaults to `log`) |
| `RESEND_API_KEY` | **MISSING** |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM` | **MISSING** |
| Outbox honesty | **PASS** — `skipped` when log; does not fake delivery |
| Customer/admin in-app/API status | **PASS** for controlled TEST ops |

**NOTIFICATIONS:** **FAIL** for real-money (no external provider).  
**Controlled TEST:** **P1_WITH_SAFE_FALLBACK** — ops can rely on admin + customer status; email/SMS not delivered externally.

No authenticated Resend/Twilio access available this session to auto-configure providers.

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
| `EMAIL_PROVIDER` / `SMS_PROVIDER` | MISSING → app default `log` |
| `RESEND_API_KEY` / Twilio | MISSING → notifications not delivered externally |
| `SENTRY_DSN` | MISSING |
| `NEXT_PUBLIC_SENTRY_DSN` | MISSING |
| `IDENTITY_PROVIDER_CONNECTED` / `BACKGROUND_PROVIDER_CONNECTED` | MISSING → PENDING_PROVIDER |

Stripe **TEST** only. Do not enable LIVE without founder approval after P0 clear.

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
| 1 | Env audit | **PASS** | Local TEST Stripe + Supabase; no LIVE keys |
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
| 18 | Observability | **FAIL** | Vercel `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` MISSING; SDK not wired — see P0 |
| 19 | Regression lint/typecheck/tests/build | **PASS** | lint/typecheck/272 tests/build OK this session |
| 20 | Full lifecycle proof | **PASS** | Stripe TEST BOOK→PAY→WEBHOOK→… this session |

---

## P0 LAUNCH BLOCKERS (2 remaining) — dependency order

1. **Sentry / production error monitoring — FAIL** — Vercel Production `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` **MISSING** (CLI 2026-08-12T04:42Z). `@sentry/nextjs` not installed; `src/lib/monitoring/sentry.ts` remains a stub. No verified production error capture. **Blocks real-money per founder rule.**  
2. **Notifications — providers not connected — FAIL (real-money) / P1_WITH_SAFE_FALLBACK (controlled TEST)** — Resend/Twilio MISSING; defaults to log; outbox marks `skipped` honestly. In-app/API status works for controlled TEST ops. **Blocks real-money per founder rule.**

Cleared this session:

- ~~Production Maps Places referrer / autocomplete~~ **CLEARED** (apex + www + current location evidence above).  
- ~~Fresh Stripe TEST lifecycle / smoke~~ **CLEARED** (booking `4700004e-…`).

---

## P1 (important, not blocking controlled TEST)

- Notification email/SMS for cleaner “on the way” etc. (ops can use admin + customer status for controlled TEST).  
- Retention / Brain / recurring migrations not on remote (unused for core pay).  
- Legal pages polish; full mobile matrix; RLS advisor hygiene re-run.  
- Preview-domain Maps referrer if agents test on `*.vercel.app`.

---

## What passed with evidence

- **Production Maps:** apex + www autocomplete + select + geolocation reverse geocode.  
- Local Stripe **TEST** smoke + webhook + customer/admin visibility.  
- Lint / typecheck / 272 tests / build green.  
- No LIVE Stripe keys; Connect off.

---

## HUMAN ACTION REQUIRED (exactly one)

**In Vercel → Project `maidlinx/website` → Settings → Environment Variables → Production, add both `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` (same DSN from Sentry project `maidlinx-production`), then trigger a Production redeploy.**

Sentry sign-in opened for founder: https://sentry.io/auth/login/  
After DSN is FOUND on Production, authorize Lead Engineer to install/wire `@sentry/nextjs`, redeploy, and prove one safe TEST error.  
Do **not** enable Stripe LIVE until Maps (done) + Sentry PASS + notification providers PASS + founder LIVE approval.
