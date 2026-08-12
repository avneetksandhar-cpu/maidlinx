# MaidLinx Launch Gate

**Date:** 2026-08-12  
**Branch:** `split/o-launch-gate` (PR #16)  
**Production SHA:** _(see FINAL REPORT after wallet deploy)_  
**Mode:** Launch Gate — Phase 1 lifecycle PASS; Phase 2 wallets (TEST)  
**Rule:** UI ≠ proven. Secrets reported FOUND / EMPTY / MISSING / INVALID only — never values.  
**HARD RULE (founder):** `READY FOR REAL-MONEY LAUNCH: YES` only when **Maps + Sentry + notification providers** all **PASS** *and* Stripe LIVE is explicitly approved. Stripe LIVE remains disabled.

---

## FINAL AUDIT VERDICT (2026-08-12T21:50Z ET) — wallets + lifecycle

| Metric | Count / value |
|--------|------:|
| LAUNCH BLOCKERS (P0) | **0** |
| P0_REMAINING | **0** |
| READY FOR CONTROLLED TEST LAUNCH | **YES** |
| READY FOR REAL-MONEY LAUNCH | **NO** (Stripe LIVE disabled; must stay NO) |

### Phase 1 — Final regression proof (SHA `493c4c1`) — **PASS**

| Check | Result | Evidence |
|-------|--------|----------|
| Apex + www SHA | **PASS** | `/api/health` `release=493c4c196a347ba722cb75dc32579b09f74fe3b2` on `maidlinx.com` and `www` |
| Sentry | **PASS** | `/api/health` `sentry=true` (apex + www); no secrets in logs |
| Unchecked consent blocked | **PASS** | `POST /checkout` → `400 LEGAL_CONSENT_REQUIRED` (false + missing) |
| Checked consent → one PI | **PASS** | Booking `21c3fe01-…` → PI `pi_3U3jvrFAmKhvpBtw1NNGtyXd`; second checkout `reused:true` same PI |
| BOOK→PAY→DB confirm | **PASS** | UI “You’re booked.” / Paid; DB `payment_succeeded`; **1** `payments` row `succeeded:5319` |
| OFFER→ACCEPT→ASSIGN→COMPLETE | **PASS** | Offer `06c2931a-…` accepted; cleaner `ba902d50-…`; events `offer_created>offer_accepted>cleaner_on_the_way>cleaner_arrived>job_started>job_completed`; final `status=completed` |
| Duplicate charge protection | **PASS** | PI reuse + checkout idempotency key; single payment row after reconfirm |

**FINAL_TEST_LIFECYCLE: PASS** on booking `21c3fe01-110e-4552-b21b-1778553b1c6f` (Stripe TEST card / `pm_card_visa`).

### Phase 2 — Wallets (TEST only)

| Check | Result | Evidence |
|-------|--------|----------|
| CHECKOUT_TYPE | **Payment Element + PaymentIntent** (`automatic_payment_methods`) + **Express Checkout Element** | Not Stripe-hosted Checkout; no `payment_method_types` for Apple/Google Pay |
| Domain registration (TEST) | **PASS** | `maidlinx.com` + `www.maidlinx.com` → `payment_method_domains` apple/google/link **active** |
| APPLE_PAY_TEST | **CONFIGURED / DEVICE-LIMITED** | ECE + domain active; full wallet sheet needs Safari/Apple device with Wallet card |
| GOOGLE_PAY_TEST | **CONFIGURED / DEVICE-LIMITED** | ECE + domain active; needs compatible Chrome/Android with Google Pay |
| STRIPE_LINK_TEST | **CONFIGURED** | Link enabled via ECE `link:auto` + Payment Element; domain `link=active` |
| CARD_FALLBACK_TEST | **PASS** (Phase 1) | Card/`pm_card_visa` completed full lifecycle on same PI path |
| Code change | Express Checkout Element added; PayPal/Klarna/Amazon Pay explicitly `never` | Minimal change; same consent → one PI → confirm lifecycle |

**RESEND:** No new marketing/customer spam this session (status emails may fire from job transitions on the TEST booking — no extra Resend probes).

---

## READY TO LAUNCH: **NO** (real money)

| Metric | Count |
|--------|------:|
| LAUNCH BLOCKERS (P0) | **0** |
| P1 open | see below |

**READY FOR CONTROLLED TEST LAUNCH: YES**  
**READY FOR REAL-MONEY LAUNCH: NO** (Stripe LIVE disabled by design)

---

## Sentry production check — **PASS**

| Check | Result |
|-------|--------|
| `/api/health` `sentry` | **true** (apex + www) |
| Probe route | Removed → 404 |
| `sendDefaultPii` | **false** |

---

## Checkout consent — **PASS**

Server enforces consent before booking lookup / Stripe. Policy version `maidlinx-legal-2026-08-12`.

---

## Env audit (names only)

| Variable | Status |
|----------|--------|
| Stripe LIVE keys (`sk_live_` / `pk_live_`) | NO (absent) |
| Stripe TEST | USED for lifecycle + domain registration |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | FOUND; SDK live |
| Resend / email vars | FOUND |

---

## P0 LAUNCH BLOCKERS (0 remaining)

- ~~Production Maps Places~~ **CLEARED**  
- ~~Resend email delivery~~ **CLEARED**  
- ~~Production Sentry SDK on live SHA~~ **CLEARED**  
- ~~Checkout Terms/Privacy consent~~ **CLEARED**  
- ~~Fresh Stripe TEST full lifecycle~~ **CLEARED** (Phase 1)  
- ~~Wallet domain registration (TEST)~~ **CLEARED**  

**Not a P0 (by design):** Stripe LIVE disabled until founder approval.

---

## P1 (important, not blocking controlled TEST)

- Twilio / SMS  
- Founder device proof of Apple Pay / Google Pay wallet sheets  
- Merge split PRs `#2–#16` into `main`  
- Legal counsel review of placeholders  
- `SENTRY_AUTH_TOKEN` for source maps  
- Preview-domain Maps referrer  

---

## PR / deploy map

| Ref | SHA | Notes |
|-----|-----|-------|
| `origin/main` | `db5fd3d` | No split PRs merged |
| Production (pre-wallet) | `493c4c1` | Phase 1 lifecycle proven here |
| `split/o-launch-gate` (PR #16) | tip after wallet commit | Express Checkout + LAUNCH_GATE evidence |

---

## HUMAN ACTION REQUIRED

1. **Keep Stripe LIVE disabled** — no `sk_live_` / `pk_live_` until explicit founder approval.  
2. **Optional device proof:** Safari/Apple device for Apple Pay; compatible device for Google Pay (domains already active in TEST).  
3. **Authorize Stripe MCP TEST mode** if agents need Dashboard/MCP wallet inspection (currently MCP session was LIVE-only; TEST work used local `sk_test` without printing secrets).  
4. **Optional:** merge split stack `#2…#16` into `main`.  
5. **No further Resend TEST sends** unless founder requests.

**READY_FOR_REAL_MONEY_LAUNCH: NO**
