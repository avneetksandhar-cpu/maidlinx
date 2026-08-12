# MaidLinx Launch Gate

**Date:** 2026-08-12  
**Branch:** `split/o-launch-gate` (PR #16)  
**Production SHA:** `ca3c88faecd50b32e9be181f4d96adb23ea58a63`  
**Mode:** Launch Gate re-audit — controlled TEST lifecycle re-proven  
**Rule:** UI ≠ proven. Secrets reported FOUND / EMPTY / MISSING / INVALID only — never values.  
**HARD RULE (founder):** `READY FOR REAL-MONEY LAUNCH: YES` only when **Maps + Sentry + notification providers** all **PASS** *and* Stripe LIVE is explicitly approved. Stripe LIVE remains disabled.

---

## FINAL AUDIT VERDICT (2026-08-12T22:58Z ET) — fresh re-audit

| Metric | Count / value |
|--------|------:|
| LAUNCH BLOCKERS (P0) | **0** |
| P0_REMAINING | **0** |
| READY FOR CONTROLLED TEST LAUNCH | **YES** |
| READY FOR REAL-MONEY LAUNCH | **NO** (Stripe LIVE disabled; must stay NO) |

### Production identity

| Check | Result | Evidence |
|-------|--------|----------|
| Apex SHA | **PASS** | `maidlinx.com/api/health` → `release=ca3c88faecd50b32e9be181f4d96adb23ea58a63` |
| www SHA | **PASS** | `www.maidlinx.com/api/health` → same SHA |
| Sentry | **PASS** | `sentry=true` (apex + www) |
| Stripe LIVE keys | **NO** | Absent by policy; local + prior prod lifecycle used `sk_test` / `pk_test` only |

### Security / payment probes (live)

| Check | Result | Evidence |
|-------|--------|----------|
| `/admin` unauth | **PASS** | `307` → `/sign-in?next=%2Fadmin` |
| `/api/admin/*` unauth | **PASS** | `401` `Authentication required.` |
| `/owner` on prod SHA | **N/A** | `404` (Owner vCenter not on live SHA; branch tip only — not a customer open hole) |
| Checkout consent false/missing | **PASS** | `400 LEGAL_CONSENT_REQUIRED` before Stripe |
| Homepage secret leak scan | **PASS** | No `sk_*` / service_role strings in HTML |
| Secrets server-only | **PASS** | `STRIPE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY` not in client modules; only `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` public |

### Fresh Stripe TEST lifecycle (2026-08-12T22:58Z) — **PASS**

Local app → same Supabase project + Stripe TEST (EMAIL/SMS providers = `log`; no customer spam).

| Step | Result | Evidence |
|------|--------|----------|
| QUOTE | **PASS** | Toronto `100 Queen St W` → `totalCents=21275` CAD |
| BOOK | **PASS** | Booking `140b7aaa-d4e7-4384-aab6-b1ba7bb086a6` `pending_payment` |
| CONSENT block | **PASS** | Unchecked → `LEGAL_CONSENT_REQUIRED` |
| CHECKOUT + PI reuse | **PASS** | PI `pi_3U3l6DFAmKhvpBtw0kh56tLN`; second checkout `reused:true` |
| STRIPE_PAY (TEST) | **PASS** | `pm_card_visa` → PI `succeeded` (`livemode=false`) |
| CONFIRM_DB | **PASS** | Status `awaiting_assignment`; `payment_status=deposit_paid` |
| WEBHOOK verify + dedupe | **PASS** | Signed `payment_intent.succeeded` → `200`; replay → `200` no-op |
| PAYMENT_ROWS | **PASS** | **1** payments row for PI |
| OFFER→ACCEPT→ASSIGN | **PASS** | Offer `20e59cc9-…`; cleaner `ba902d50-…`; **1** active assignment |
| STATUS→COMPLETE | **PASS** | `on_the_way`→`arrived`→`in_progress`→`completed` |
| RATING | **PASS** | Review `19d66317-…` rating 5 |
| Single cleaner | **PASS** | `active_assignments=1` |

**FINAL_TEST_LIFECYCLE: PASS** on booking `140b7aaa-d4e7-4384-aab6-b1ba7bb086a6` (Stripe TEST / `pm_card_visa`).

Prior proven booking still completed: `21c3fe01-110e-4552-b21b-1778553b1c6f`.

### Phase 2 — Wallets (TEST only) — unchanged

| Check | Result | Evidence |
|-------|--------|----------|
| CHECKOUT_TYPE | Payment Element + Express Checkout Element | Domains registered TEST |
| APPLE_PAY / GOOGLE_PAY | CONFIGURED / DEVICE-LIMITED | Needs founder device proof |
| CARD_FALLBACK | **PASS** | Fresh lifecycle above |

---

## READY TO LAUNCH: **NO** (real money)

| Metric | Count |
|--------|------:|
| LAUNCH BLOCKERS (P0) | **0** |
| P1 open | see below |

**READY FOR CONTROLLED TEST LAUNCH: YES**  
**READY FOR REAL-MONEY LAUNCH: NO** (Stripe LIVE disabled by design)

---

## Cleaner fulfillment (ops)

| Check | Result |
|-------|--------|
| Approved active cleaners (DB) | **1** (`ba902d50-…`, phone+email verified, MaidLinx verified) |
| Service zones / services / availability rows | **0 / 0 / 0** for that cleaner |
| Auto-match readiness | **GAP · P1 / HUMAN** — controlled TEST OK with **manual** admin offer/dispatch |
| Markets active in app | Toronto GTA + South Florida |
| Geographic empty-supply if ads open | **HUMAN ops P0** if traffic opens without a ready cleaner in the city |

### Dual-market coverage verification (2026-08-12T23:21Z ET)

**Rule:** TORONTO_GTA and SOUTH_FLORIDA are independent. Do not combine for launch readiness. Configured ≠ booking/launch ready.

| Metric | Value |
|--------|------:|
| TOTAL_REAL_CLEANERS (DB rows) | **2** (1 applicant + 1 approved; no fabricated accounts) |
| APPROVED_CLEANERS (approved+active) | **1** |
| BOOKABLE_CLEANERS | **0** |
| EXISTING_CLEANER_REAL_MARKET | **HUMAN_INPUT_REQUIRED** (`ba902d50-…` `market_id=null`, 0 zones) |
| TORONTO_GTA_COVERAGE_READY | **NO** |
| SOUTH_FLORIDA_COVERAGE_READY | **NO** |
| READY_FOR_STRIPE_LIVE_CONFIGURATION | **NO** |

| MARKET | APPROVED | BOOKABLE | AVAIL TODAY | SERVICES | ZONES | PRICING | CURRENCY | booking_enabled | launch_enabled | COVERAGE_READY | LAUNCH_READY | STATUS |
|--------|--------:|---------:|------------:|---------:|------:|---------|----------|-----------------|----------------|----------------|--------------|--------|
| TORONTO_GTA | 0* | 0 | 0 | 9 | 3–4 cfg | NO† | CAD YES | false | false | NO | NO | 🔴 RED |
| SOUTH_FLORIDA | 0* | 0 | 0 | 9 | 3 cfg | NO‡ | USD YES | false | false | NO | NO | 🔴 RED |

\*Approved cleaner not attributed to either market.  
†GTA uses global `SERVICE_BASE_CENTS` in CAD; founder must confirm price card + tax/HST.  
‡FL market-specific USD prices = HUMAN_INPUT_REQUIRED (do not treat CAD-tuned globals as FL truth).

**Coverage GREEN rule:** ≥2 bookable cleaners + online capacity + catalog services + zone coverage + pricing ready — never GREEN for one cleaner alone.

**Architecture (branch tip):** per-market `booking_enabled` / `launch_enabled`; strict marketplace eligibility service; `/owner/cleaners` market tabs ALL | TORONTO_GTA | SOUTH_FLORIDA with Bookable YES/NO + exact blocker; owner ops editor at `/owner/cleaners/[cleanerId]` for REAL market/zones/services/availability/unavailable dates/online (no fabricate). Report: `company/AGENT_REPORTS/2026-08-12-launch-phase1-cleaner-ops.md`.

**Booking create:** fails closed with `403 BOOKING_DISABLED` while `booking_enabled=false` (both markets). Address→market→currency still resolves for preview.

**Supply UX:** Arrival windows default `available=true` when `supplyByWindow` omitted — do not treat as proven capacity.

**Payout / Stripe LIVE:** unchanged OFF. No new paid products.

### Phase 1 STOP — HUMAN_INPUT_REQUIRED (cleaner coverage)

Do **not** enable `booking_enabled` / `launch_enabled` until coverage ready per market.

1. Open `/owner/cleaners` — confirm TORONTO_GTA + SOUTH_FLORIDA are independent 🔴 RED.  
2. For approved cleaner `ba902d50-…` open `/owner/cleaners/ba902d50-…` (full UUID from table Edit link) and enter **only real facts**:
   - Market: `TORONTO_GTA` **or** `SOUTH_FLORIDA` (do not guess)
   - Service zones (same market)
   - Services offered
   - Recurring weekly availability (Save to persist rows)
   - Unavailable dates (YYYY-MM-DD lines)
   - Online for auto-offers (when ready)
3. Approve/activate other cleaners at `/admin/cleaners` if needed, then complete ops for each at `/owner/cleaners/[id]`.  
4. Coverage GREEN needs ≥2 **bookable** cleaners in that market (plus pricing ready) — recruit second cleaner before enabling booking.  
5. Keep Stripe LIVE off.

---

## P0 LAUNCH BLOCKERS (0 remaining)

- ~~Production Maps Places~~ **CLEARED**  
- ~~Resend email delivery~~ **CLEARED**  
- ~~Production Sentry SDK on live SHA~~ **CLEARED**  
- ~~Checkout Terms/Privacy consent~~ **CLEARED**  
- ~~Fresh Stripe TEST full lifecycle~~ **CLEARED** (re-proven 2026-08-12T22:58Z)  
- ~~Wallet domain registration (TEST)~~ **CLEARED**  
- ~~Admin route customer access~~ **CLEARED** (server redirect/401)  
- ~~Webhook signature + payment idempotency~~ **CLEARED**  
- ~~Double-cleaner assignment~~ **CLEARED** (unique active assignment)

**Not a P0 (by design):** Stripe LIVE disabled until founder approval.

---

## P1 (important, not blocking controlled TEST)

- Twilio / SMS (`SMS_PROVIDER=log` default)  
- Cleaner offer email/SMS notify (events only today)  
- Offer decline API/UI  
- Cleaner cancel / no-show / access-fail / safety incident product paths  
- Founder device proof of Apple Pay / Google Pay sheets  
- Cleaner zone/service/availability data for the approved pro  
- Analytics: founder names `homepage_view` / `address_entered` / `quote_*` / `payment_completed` missing; sink = console (partial `checkout_started` / `booking_completed`)  
- Merge split PRs `#2–#16` into `main`  
- Legal counsel review of placeholders  
- `SENTRY_AUTH_TOKEN` for source maps  
- NY/CA SQL `active=true` vs TS `active=false` drift  
- Owner vCenter / AI OS migrations `00029`–`00031` (local only; not on prod SHA)

---

## PR / deploy map

| Ref | SHA | Notes |
|-----|-----|-------|
| `origin/main` | `db5fd3d` | No split PRs merged |
| Production (live) | `ca3c88f` | Wallets + consent + Sentry; lifecycle re-proven |
| `split/o-launch-gate` (PR #16) tip | ahead (AI OS / Owner vCenter) | **Not** required for controlled TEST; do not block on AI OS |

---

## HUMAN ACTION REQUIRED

1. **Keep Stripe LIVE disabled** — no `sk_live_` / `pk_live_` until explicit founder approval.  
2. **Enter REAL cleaner ops** at `/owner/cleaners/[cleanerId]` for `ba902d50-…`: market, zones, services, recurring availability, unavailable dates, online (see Phase 1 STOP above).  
3. **Approve/activate** at `/admin/cleaners` as needed; recruit ≥1 additional bookable cleaner in the same market before coverage GREEN.  
4. **Confirm market prices:** GTA CAD price card + tax/HST; South Florida USD price card (separate).  
5. **Enable flags independently** when ready: `booking_enabled` and/or `launch_enabled` per market at `/admin/markets` (both currently false).  
6. **Optional device proof:** Safari Apple Pay / Chrome Google Pay (domains already active in TEST).  
7. **Optional:** merge split stack `#2…#16` into `main`.  
8. **No further Resend TEST spam** unless founder requests.

**READY_FOR_CONTROLLED_TEST_LAUNCH: YES** (prior lifecycle; new bookings gated until a market’s `booking_enabled=true`)  
**READY_FOR_CONTROLLED_REAL_MONEY_LAUNCH: NO**  
**TORONTO_GTA_COVERAGE_READY: NO** · **SOUTH_FLORIDA_COVERAGE_READY: NO**
