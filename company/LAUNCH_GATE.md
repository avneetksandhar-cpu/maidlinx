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
2. **Before inviting 5–10 real TEST customers:** confirm at least one approved cleaner can cover the launch city (zones/services/availability or standby manual dispatch).  
3. **Optional device proof:** Safari Apple Pay / Chrome Google Pay (domains already active in TEST).  
4. **Optional:** merge split stack `#2…#16` into `main`.  
5. **No further Resend TEST spam** unless founder requests.  
6. **AI OS / Owner vCenter:** founder-optional prod deploy after BOOK→PAY smoke — does **not** change LIVE money status.

**READY_FOR_CONTROLLED_TEST_LAUNCH: YES**  
**READY_FOR_CONTROLLED_REAL_MONEY_LAUNCH: NO**
