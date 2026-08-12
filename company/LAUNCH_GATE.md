# MaidLinx Launch Gate

**Date:** 2026-08-12  
**Branch:** `cursor/launch-gate` → evidence on `split/o-launch-gate` (PR #16)  
**Mode:** Launch Gate — no new features; evidence only  
**Rule:** UI ≠ proven. Secrets reported FOUND / EMPTY / MISSING / INVALID only — never values.  
**HARD RULE (founder):** `READY FOR REAL-MONEY LAUNCH: YES` only when **Maps + Sentry + notification providers** all **PASS**. Stripe LIVE remains disabled until explicit founder approval after those three.

---

## FINAL AUDIT VERDICT (2026-08-12T08:00Z ET)

| Metric | Count / value |
|--------|------:|
| LAUNCH BLOCKERS (P0) | **2** |
| READY FOR CONTROLLED TEST LAUNCH | **NO** |
| READY FOR REAL-MONEY LAUNCH | **NO** (must remain NO while Stripe LIVE off) |

### P0_REMAINING (2)

1. **Production Sentry SDK absent** — live `maidlinx.com` deployment SHA `c2a7e4e6633610dc5e282498d4eee3dcf55837fc` (`cursor/launch-gate`, `dpl_4FJRwssWKCi1LpJUq1nyt68tSBhc`, `gitDirty=1`) has **no** `@sentry/nextjs` (stub `src/lib/monitoring/sentry.ts` only logs `[monitoring:pending-sentry]`). Homepage HTML has **no** Sentry loader markers. Gate tip `ff9dc3d` **does** include `@sentry/nextjs` + instrumentation, but that commit is **not** the Production alias. Prior Sentry TEST event is historical — **not** proof of current Production SDK.
2. **Checkout Terms/Privacy consent checkbox missing** — payment UI (`checkout-step.tsx` / `booking-payment-form.tsx`) has Stripe `PaymentElement` only; no required agree-to-Terms/Privacy control before pay.

### Also verified this audit (not counted as extra P0s above)

| Area | Result | Evidence |
|------|--------|----------|
| **RESEND_DELIVERY** | **PASS** (retained) | No new send. Prior id prefix `a16c1687-f2b…` Sent→Delivered + human inbox at `info@maidlinx.com`. This session: Resend API list/domains from this host returned Cloudflare **403/1010** — could not re-fetch log via API; human confirmation still stands. Vercel Production env **names** FOUND: `EMAIL_PROVIDER`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `EMAIL_FROM`. |
| Maps | PASS (prior live browser) | Apex + www Places + geolocation — not re-browsered this session |
| Stripe LIVE | **DISABLED** | Local prefixes `pk_test_` / `sk_test_`; Vercel has Stripe keys; **no** `sk_live_` / `pk_live_` in repo |
| Apple/Google Pay / Link | **NOT STARTED** | Placeholder copy only; no wallet work begun |
| Terms / Privacy / Cleaner agreement | **PASS on live** | `https://maidlinx.com/legal/terms` `privacy` `cleaner-agreement` → **200** (placeholders: “LEGAL REVIEW REQUIRED”). Dedicated `/legal/cancellation` `/refund` `/damage` → **404**; cancel/refund draft text lives inside Terms. |
| Legal on `split/o-launch-gate` tip | Was **MISSING** (0 files) | Would 404 if gate tip were promoted as-is. **Restored** from `c2a7e4e` onto this branch in final-audit commit. |
| Admin auth | PASS (code) | Middleware + `requireAdminSession` / role gates |
| Webhook sig + idempotency | PASS (code) | `constructEvent` + `stripe_webhook_events` insert; booking API rate limits present; webhook route itself not rate-limited |
| Secrets scan | PASS | No committed `.env.local`; no service-role in client; no live Stripe keys in repo |
| Cleaner availability | PASS (code) | Weekly slots + unavailable dates + matching eligibility |
| Support / refunds | PARTIAL | `/dashboard/support`, cancel dialog 24h rule, admin refunds API; no standalone damage policy page |
| Fresh Production BOOK→PAY→WEBHOOK→ASSIGN→ACCEPT→COMPLETE | **GAP** | Prior smoke was **local** + Stripe TEST (`scripts` / prior booking ids). **No fresh Production lifecycle** this audit. |
| Required PRs → `main` | **NONE merged** | Split PRs **#2–#16 all OPEN**; `main` = `db5fd3d`. Production is **direct deploy** from `cursor/launch-gate`, not merge-to-main. |

### Exact human actions required

1. **Redeploy Production** from a commit that includes `@sentry/nextjs` (e.g. after merging/pushing this gate tip with Sentry + restored legal pages) to `maidlinx.com` (`vercel --prod --scope maidlinx` from that SHA). Confirm live HTML/SDK + one controlled Sentry TEST event (then remove any temporary test route).
2. **Add checkout consent checkbox** (required Terms + Privacy before pay) and redeploy.
3. **Keep Stripe LIVE disabled** — no `sk_live_` / `pk_live_` until explicit founder approval after Maps + Sentry + notifications all PASS on the **same** Production SHA.
4. **Do not begin** Apple Pay / Google Pay / Link work.
5. **Optional but recommended:** run one fresh Stripe **TEST** lifecycle on Production (BOOK→PAY→WEBHOOK→ASSIGN→ACCEPT→COMPLETE); merge split stack `#2…#16` into `main` (or formally accept direct-prod deploys).
6. **No further Resend TEST sends** unless founder requests — delivery already human-confirmed.

---

## READY TO LAUNCH: **NO** (real money)

| Metric | Count |
|--------|------:|
| LAUNCH BLOCKERS (P0) | **2** |
| P1 open | see below |

**READY FOR CONTROLLED TEST LAUNCH: NO** (Production Sentry SDK missing on live SHA; checkout consent missing)  
**READY FOR REAL-MONEY LAUNCH: NO** (Stripe LIVE disabled; Sentry not on live SHA; consent missing)

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

## Sentry production check

### Prior claim (2026-08-12T05:24Z) — historical only

Prior agent recorded org/project, Vercel DSN FOUND, `@sentry/nextjs` wired on **gate tip**, and TEST issue `MAIDLINX-PRODUCTION-1`.

### Final audit recheck (2026-08-12T08:00Z) — **FAIL on live**

| Check | Result | Evidence |
|-------|--------|----------|
| Live Production deployment | `dpl_4FJRwssWKCi1LpJUq1nyt68tSBhc` | Aliases: `maidlinx.com`, `www.maidlinx.com` |
| Live git SHA | `c2a7e4e6633610dc5e282498d4eee3dcf55837fc` | ref `cursor/launch-gate`; message “Record Sentry DSN still missing…”; `gitDirty=1` |
| `@sentry/nextjs` on that SHA | **ABSENT** | `package.json` has no dependency; only stub monitor |
| Live HTML Sentry markers | **ABSENT** | No `sentry` / ingest strings on homepage |
| Vercel Production `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | **FOUND** (names) | Env alone ≠ SDK active |
| Gate tip `ff9dc3d` Sentry wiring | **PRESENT in git** | Not aliased to Production |

**SENTRY (current Production): FAIL** — redeploy required.

---

## Notifications / Resend (2026-08-12)

| Check | Result | Evidence |
|-------|--------|----------|
| Vercel Production `EMAIL_PROVIDER` | **FOUND** | names only |
| Vercel Production `RESEND_API_KEY` | **FOUND** | Sensitive; never printed |
| Vercel Production `RESEND_FROM_EMAIL` / `EMAIL_FROM` | **FOUND** | |
| SMS / Twilio | **MISSING** | P1 |
| Controlled Resend TEST | **PASS** (one send; no re-send this audit) | See below |
| **RESEND_DELIVERY** | **PASS** | Delivered + human inbox; API re-list blocked (CF 1010) this host |

### Controlled TEST email (exactly one — do not repeat)

| Field | Value |
|-------|--------|
| To | `info@maidlinx.com` |
| From | `MaidLinx <bookings@mail.maidlinx.com>` |
| Reply-To | `info@maidlinx.com` |
| Subject | MaidLinx Launch Gate TEST — production Resend delivery |
| Resend id (prefix) | `a16c1687-f2b…` |
| Resend events | **Sent** Aug 12, 3:49 AM ET → **Delivered** Aug 12, 3:49 AM ET |
| Human inbox | **CONFIRMED** at `info@maidlinx.com` |

`mail.maidlinx.com` is the Resend **sending subdomain only**. Replies go to `info@maidlinx.com`.

**NOTIFICATIONS (email / Resend): PASS** for provider delivery. App `email.ts` From/Reply-To lock committed on gate branch in final-audit commit — still requires Production redeploy to match.

Stripe LIVE remains disabled (TEST keys only).

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
| `STRIPE_CONNECT_ENABLED` | MISSING (off — correct) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | FOUND |
| `EMAIL_PROVIDER` / Resend vars | FOUND |
| `SMS_PROVIDER` / Twilio | MISSING |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | FOUND (env); SDK not on live SHA |

---

## Fresh TEST E2E evidence (prior session — local, not Production)

Script against local + remote Supabase + Stripe **TEST** (historical):

| Checkpoint | Result | Evidence (ids only) |
|------------|--------|---------------------|
| BOOK | **PASS** | booking `4700004e-29a3-4756-a85b-ccb20b33a574` |
| PAY (Stripe TEST) | **PASS** | PI `pi_3U3TfrFAmKhvpBtw2TMlirtX` (livemode=false) |
| WEBHOOK | **PASS** | signed claim → 200 |
| PAYMENT DB | **PASS** | `awaiting_assignment` + `deposit_paid` |

**Final audit:** historical local ≠ fresh Production proof. **PRODUCTION LIFECYCLE: GAP**.

---

## Scorecard (founder §1–20) — final audit overlay

| # | Area | Result | Evidence |
|---|------|--------|----------|
| 1 | Env audit | **PASS** | TEST Stripe; no LIVE keys; Resend FOUND |
| 2 | Migrations | **PARTIAL** | Core pay path; retention/brain gaps non-blocking |
| 3 | TEST personas | **PASS** (prior) | |
| 4 | Customer book / Maps | **PASS** (prior live) | |
| 5 | Price attack | **PASS** (code) | `assertPriceMatch` |
| 6 | Stripe TEST + webhook | **PASS** (local prior) / **GAP** (fresh prod) | |
| 7 | Cleaner security | **PASS** (code) | |
| 8 | Dispatch + race accept | **PASS** (prior/code) | |
| 9 | Cleaner job lifecycle | **PASS** (prior) | |
| 10 | Customer live status | **PASS** (prior API) | |
| 11 | Admin + cross-role | **PASS** (code + prior) | |
| 12 | Rating + rebook | **PARTIAL** | |
| 13 | Mobile QA | **PARTIAL** | |
| 14 | Failure recovery / secrets | **PASS** | No secrets printed |
| 15 | Privacy / legal | **PARTIAL** | Live placeholder pages; consent missing (P0) |
| 16 | RLS / authorization | **PARTIAL** | Policies present; some table gaps; advisors not re-run |
| 17 | Performance | **PASS** (build prior) | |
| 18 | Observability | **FAIL** (live) | DSN FOUND; SDK absent on Production SHA |
| 19 | Regression suite | **PASS** (prior session) | Not re-run this audit |
| 20 | Full lifecycle proof | **PARTIAL** | Local TEST prior; Production gap |

---

## P0 LAUNCH BLOCKERS (2 remaining)

- ~~Production Maps Places~~ **CLEARED**  
- ~~Resend email delivery~~ **CLEARED** (`RESEND_DELIVERY: PASS`)  
- **Production Sentry SDK on live SHA** — **OPEN**  
- **Checkout Terms/Privacy consent** — **OPEN**  

**Not a P0 (by design):** Stripe LIVE disabled until founder approval.

---

## P1 (important, not blocking once P0s clear)

- Twilio / SMS  
- Fresh Production Stripe TEST full lifecycle  
- Merge split PRs `#2–#16` into `main` (currently all OPEN; prod ≠ main)  
- Dedicated cancellation/refund/damage legal pages (draft text only inside Terms)  
- Legal counsel review of placeholders  
- RLS advisor hygiene; webhook route rate limit  
- Preview-domain Maps referrer  
- `SENTRY_AUTH_TOKEN` for source maps  

---

## PR / deploy map (final audit)

| Ref | SHA | Notes |
|-----|-----|-------|
| `origin/main` | `db5fd3d` | No split PRs merged |
| Production `maidlinx.com` | `c2a7e4e` | `cursor/launch-gate`; Sentry stub only |
| `origin/split/o-launch-gate` (PR #16) | was `ff9dc3d` | Has Sentry SDK; legal was missing until final-audit restore |
| Open PRs | `#1`–`#16` | All OPEN; stack bases on prior splits |

---

## HUMAN ACTION REQUIRED

See **Exact human actions required** under FINAL AUDIT VERDICT above.
