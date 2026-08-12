# MaidLinx Launch Gate

**Date:** 2026-08-12  
**Branch:** `split/o-launch-gate` (PR #16)  
**Production SHA:** `493c4c196a347ba722cb75dc32579b09f74fe3b2`  
**Mode:** Launch Gate — P0 repair complete for controlled TEST launch  
**Rule:** UI ≠ proven. Secrets reported FOUND / EMPTY / MISSING / INVALID only — never values.  
**HARD RULE (founder):** `READY FOR REAL-MONEY LAUNCH: YES` only when **Maps + Sentry + notification providers** all **PASS** *and* Stripe LIVE is explicitly approved. Stripe LIVE remains disabled.

---

## FINAL AUDIT VERDICT (2026-08-12T17:30Z ET) — P0 repair

| Metric | Count / value |
|--------|------:|
| LAUNCH BLOCKERS (P0) | **0** |
| P0_REMAINING | **0** |
| READY FOR CONTROLLED TEST LAUNCH | **YES** |
| READY FOR REAL-MONEY LAUNCH | **NO** (Stripe LIVE disabled; must stay NO) |

### P0_REMAINING (0)

~~1. Production Sentry SDK absent~~ **CLEARED** — Production `maidlinx.com` / `www` on SHA `493c4c1` reports `/api/health` `sentry:true`. Controlled probe event landed as Sentry issue `MAIDLINX-PRODUCTION-2` (resolved after proof). Probe route removed; live `/api/monitoring/sentry-probe` → **404**.  
~~2. Checkout Terms/Privacy consent checkbox missing~~ **CLEARED** — Required checkbox before payment; server returns `LEGAL_CONSENT_REQUIRED` without consent; consent + policy version persisted on booking; Stripe TEST PaymentIntent create/reuse proven (same PI, `reused:true`).

### Also verified

| Area | Result | Evidence |
|------|--------|----------|
| **RESEND_DELIVERY** | **PASS** (retained) | No new send this session |
| Maps | PASS (prior live) | Apex + www |
| Stripe LIVE | **DISABLED** | TEST keys only; no `sk_live_` / `pk_live_` |
| Apple/Google Pay / Link | **NOT STARTED** | Placeholder copy only |
| Terms / Privacy / Cancel / Refund / Damage | **PASS on live** | `/legal/terms` `privacy` `cancellation` `refund` `damage` → **200** |
| Admin auth / webhook sig | PASS (code) | Unchanged |
| Secrets scan | PASS | No secrets printed |

### Exact human actions still required

1. **Keep Stripe LIVE disabled** — no `sk_live_` / `pk_live_` until explicit founder approval after Maps + Sentry + notifications all PASS on the same Production SHA (already true for those three; LIVE still blocked by founder rule).
2. **Do not begin** Apple Pay / Google Pay / Link work.
3. **Optional:** run one full Stripe **TEST** lifecycle on Production (BOOK→PAY→WEBHOOK→ASSIGN→ACCEPT→COMPLETE); merge split stack `#2…#16` into `main`.
4. **Optional:** set `SENTRY_AUTH_TOKEN` for source maps (P1).
5. **No further Resend TEST sends** unless founder requests.

---

## READY TO LAUNCH: **NO** (real money)

| Metric | Count |
|--------|------:|
| LAUNCH BLOCKERS (P0) | **0** |
| P1 open | see below |

**READY FOR CONTROLLED TEST LAUNCH: YES** (Sentry SDK live + checkout consent enforced; Stripe TEST only)  
**READY FOR REAL-MONEY LAUNCH: NO** (Stripe LIVE disabled by design)

---

## Sentry production check (2026-08-12T17:30Z) — **PASS**

| Check | Result | Evidence |
|-------|--------|----------|
| Live Production deployment | `dpl_9vq8Y6BPo2pdLaGNqS29umgMt9Hm` | Aliases: `maidlinx.com`, `www.maidlinx.com` |
| Live git SHA | `493c4c196a347ba722cb75dc32579b09f74fe3b2` | matches `/api/health` `release` |
| `@sentry/nextjs` | **PRESENT** | package + instrumentation + `withSentryConfig` |
| `/api/health` `sentry` | **true** | apex + www |
| Vercel Production `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | **FOUND** (names) | values never printed |
| Controlled probe event | **PASS** | `MAIDLINX-PRODUCTION-2` then resolved; probe route removed → **404** |
| `sendDefaultPii` | **false** | client/server/edge shared options |

**SENTRY (current Production): PASS**

---

## Checkout consent (2026-08-12T17:30Z) — **PASS**

| Check | Result | Evidence |
|-------|--------|----------|
| UI checkbox | **PASS** | Required before Continue to payment; links Terms, Privacy, Cancellation, Refund, Damage |
| Server enforce | **PASS** | Missing consent → `400 LEGAL_CONSENT_REQUIRED` (no Stripe call) |
| Persist | **PASS** | `legal_consent_accepted_at` + `legal_consent_policy_version` (`maidlinx-legal-2026-08-12`) |
| Stripe TEST PI | **PASS** | Booking `cb3f1121-…` created PI then reused same PI (`reused:true`) — no duplicate charge |
| Wallets | **NOT STARTED** | unchanged |

---

## Notifications / Resend

**RESEND_DELIVERY: PASS** (prior human inbox confirmation). No new send this repair.

---

## Env audit (names only)

| Variable | Status |
|----------|--------|
| Stripe LIVE keys (`sk_live_` / `pk_live_`) | NO (absent) |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | FOUND; SDK live on Production SHA |
| Resend / email vars | FOUND |

---

## P0 LAUNCH BLOCKERS (0 remaining)

- ~~Production Maps Places~~ **CLEARED**  
- ~~Resend email delivery~~ **CLEARED**  
- ~~Production Sentry SDK on live SHA~~ **CLEARED**  
- ~~Checkout Terms/Privacy consent~~ **CLEARED**  

**Not a P0 (by design):** Stripe LIVE disabled until founder approval.

---

## P1 (important, not blocking controlled TEST)

- Twilio / SMS  
- Fresh Production Stripe TEST full lifecycle (pay through complete)  
- Merge split PRs `#2–#16` into `main`  
- Legal counsel review of placeholders  
- `SENTRY_AUTH_TOKEN` for source maps  
- Preview-domain Maps referrer  

---

## PR / deploy map

| Ref | SHA | Notes |
|-----|-----|-------|
| `origin/main` | `db5fd3d` | No split PRs merged |
| Production `maidlinx.com` | `493c4c1` | `split/o-launch-gate`; Sentry + consent |
| `origin/split/o-launch-gate` (PR #16) | `493c4c1` | tip |

---

## HUMAN ACTION REQUIRED

See **Exact human actions still required** under FINAL AUDIT VERDICT above.
