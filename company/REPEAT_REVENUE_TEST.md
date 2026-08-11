# MaidLinx REPEAT REVENUE TEST

**Date:** 2026-08-11  
**Branch:** `cursor/live-location-and-booking-ux`  
**Role:** Lead Engineer  
**Rule:** No fake metrics, reviews, credits, or Stripe auto-charges. Env blocks = FAIL, not invented PASS.

---

## BLOCKED — ONE ACTION

**Paste `SUPABASE_SERVICE_ROLE_KEY` into project-root `.env.local` (never chat/git).**

Until set, live BOOK → COMPLETE → Book again → second sandbox booking cannot be proven (create returns `503 SUPABASE_NOT_CONFIGURED`). Stripe TEST keys still needed after that for deposit.

---

## Verdict table

| Checkpoint | Result | Evidence |
|------------|--------|----------|
| Book again | **PASS** (code) | Past + completed cards show CTA; prefill address/property/service/extras/beds; clears date/time + booking id; lands on date/entry for new id |
| Saved places | **PASS** (code) | Presets **Home / Office / Rental / Other**; chips + dashboard manager; booking reuse |
| Recurring cleaning | **FAIL** (honest partial) | UI cadence One time / Weekly / Every 2 weeks / Monthly + cancel terms on review; `recurring_preference` stored; **no Stripe Subscriptions / auto-charge**; `RECURRING_GENERATION_IMPLEMENTED=false` |
| Booking recovery | **PASS** (code) | sessionStorage draft (no payment data); **Continue your booking** banner on dashboard empty/upcoming |
| Promo foundation | **PASS** (code) | Admin coupons + server `validatePromoCode` (type, amount, min, expiration, usage, **per-customer limit**, active); customer promo field on review |
| Referral foundation | **PASS** (arch) | Migration `00023` codes + attributions; give/get architecture; self-referral + duplicate blocked; **`REFERRAL_CREDITS_LIVE=false`** — needs Product + accounting |
| Reviews | **PASS** (code) | Verified `completed` only via existing submit API + booking detail UI; no fabricated reviews |
| Favorite Pro | **PASS** (code) | Prefer this Pro / favorites; soft `preferred_professional_id` on create; **no assignment guarantee** copy |
| Analytics | **PASS** (code) | Funnel events list + promo/referral/prefer/continue; console sink; no PII in props contract |
| Revenue dashboard | **PASS** (code) | Admin `/admin/revenue` real aggregates: bookings, completed, AOV, repeat %, cancel %, revenue, cleaner earnings, platform margin |
| Mobile repeat booking | **PASS** (code) | Book again primary CTA; prefill → date; 375/390/430 layouts reuse booking chrome (not re-browsered this session) |
| Build | **PASS** | `lint` 0 errors, `typecheck`, **242** tests, `npm run build` OK |

### Repeat path usable end-to-end (live): **NO**

Code path is wired; local env still blocks create/pay/complete simulation.

---

## Simulated path (honest)

| Step | Result |
|------|--------|
| New book | **FAIL** — service role EMPTY |
| Completed | **FAIL** — depends on pay + cleaner ladder |
| Review | **FAIL** — needs completed booking |
| History → Book again | **PASS** (UI code) — CTA + prefill |
| Prefill → date/time → second sandbox booking | **FAIL** — env blocked |

---

## Shipped (minimal)

- Migration `00023_repeat_revenue_foundation.sql` (referrals, retention_events, coupon per-customer limit, preferred pro + recurring preference columns)
- Book again prefill + Past list CTA; Continue booking banner
- Recurring frequency UI (no auto-charge)
- Promo field on review; referral dashboard + API (credits off)
- Support + Referrals nav; admin revenue retention metrics
- Retention event queue architecture (`src/lib/retention/events.ts`) — providers default log / setup required

## Not done / gated

- Live Stripe recurring billing  
- Live referral credits  
- Email/SMS retention delivery (provider setup required)  
- Full e2e rebook proof without service role + Stripe TEST keys  

**After ONE ACTION:** restart `npm run dev` → create booking → Stripe TEST keys → complete one job → Book again → second booking.
