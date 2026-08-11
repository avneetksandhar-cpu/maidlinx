# MaidLinx launch audit

**Date:** 2026-08-11  
**Branch:** `cursor/live-location-and-booking-ux`  
**Auditor role:** Senior launch engineer (truthful production readiness)  
**Rule:** UI ≠ proven. Production domain tests required for Places + current location.

---

## Verdict table

| System | Status | Evidence (short) |
|--------|--------|------------------|
| CUSTOMER SYSTEM | **FAIL** | Funnel UI code-ready; prod Places broken; pay/create not e2e-proven; 0 cleaners → no fulfill |
| CLEANER SYSTEM | **FAIL** | Lifecycle APIs coded; **remote `cleaners` = 0**; Connect payouts stub |
| ADMIN/DISPATCH | **FAIL** | Assign/match APIs coded; cannot prove assign→job without supply + paid booking |
| AUTH | **PASS** | Supabase Auth + middleware role gates; leaked-password protection still **off** (P1) |
| SUPABASE | **PASS** | Project `ACTIVE_HEALTHY`; markets/zones/bookings present; local service role **EMPTY** (env gap) |
| RLS/SECURITY | **PASS** | RLS enabled on core tables; empty-policy tables default-deny; advisories = P1 hygiene |
| GOOGLE PLACES | **FAIL** | **Production** `https://maidlinx.com/book/address`: `google.maps` **not loaded**; no suggestions |
| CURRENT LOCATION | **FAIL** | **Production**: click → “We couldn't find your location…”; Maps absent so reverse-geocode cannot work |
| STRIPE CHECKOUT | **FAIL** | Local Stripe keys **EMPTY**; remote `payments` = **0**; no successful deposit proven |
| STRIPE WEBHOOKS | **FAIL** | Handler + idempotency coded; not proven (no paid events) |
| CLEANER PAYOUT SYSTEM | **FAIL** | Stripe Connect gated/stub unless `STRIPE_CONNECT_ENABLED=true` |
| REAL-TIME STATUS | **FAIL** | Code + 8s poll fallback exist; **not proven** on a live en-route job |
| NOTIFICATIONS | **FAIL** | Default `EMAIL_PROVIDER`/`SMS_PROVIDER` = **log**; push missing |
| MOBILE | **PASS** | One-screen `/book/*` + sticky footer; local 390 clearance verified; overflow-x clip added |
| TRUST CLAIMS | **PASS** | Footer = active markets only; false “auto balance after clean” / NY·CA-as-live admin copy fixed this audit |
| PRODUCTION BUILD | **PASS** | `lint` (0 errors), `typecheck`, **240** tests, `npm run build` OK (2026-08-11) |

---

## READY TO ACCEPT A REAL CUSTOMER: **NO**

### P0 blockers (exact order)

1. **Production Google Maps / Places not loading** on `https://maidlinx.com` — autocomplete dead; set/fix `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` on Vercel + enable billing / Places + Maps JS APIs; re-test on production HTTPS.
2. **Current location unusable in production** until Maps reverse-geocode works (and browser geolocation allowed) — same Maps/env/billing gate.
3. **Stripe deposit not proven** — ensure Vercel has `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (test first); complete one sandbox pay → webhook → confirmed booking.
4. **Booking create authority** — ensure production has `SUPABASE_SERVICE_ROLE_KEY` (local `.env.local` is **EMPTY**); without it create returns `503 SUPABASE_NOT_CONFIGURED`.
5. **Zero cleaner supply** — remote `cleaners` count is **0**; seed/approve ≥1 cleaner or customers pay into an empty marketplace.

---

## Area notes

### Customer journey
- **Code:** address → … → payment, server quote + `assertPriceMatch`, PaymentIntent deposit, confirm-payment fallback, post-booking `/bookings/[id]`.
- **Prod test:** `/book/address` loads; typing “100 King Street West Toronto” did **not** open Places; city/region not auto-filled; waitlist banner appeared without a resolved address.
- **Manual address** remains a fallback when Maps fails (booking can still proceed if fields filled) — but Places UX is FAIL.

### Cleaner journey
- Onboarding explicitly **not** a background check (correct).
- Job transitions: `on_the_way` → `arrived` → `in_progress` → `completed`.
- Live GPS share coded for en-route/arrived only.
- **Ops:** no cleaners → FAIL for marketplace.

### Admin / dispatch
- Assign + ranked matches exist behind admin session.
- Admin dashboard previously implied NY/CA as live “today” — **fixed** to active vs coming soon.
- `admin_permissions` empty → permission loader can fail-open to super_admin (**P1**).

### Real-time job system
- Customer booking live hook: Realtime + poll.
- Cleaner location: API poll / upsert — not a dedicated Realtime channel.
- **Unproven** without a live assigned job → FAIL for launch table.

### Production integrations / env gaps (names only — no values)
| Env | Local `.env.local` | Needed for |
|-----|-------------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` / `ANON` | SET | Auth, client |
| `SUPABASE_SERVICE_ROLE_KEY` | **EMPTY** | Booking create, admin writes |
| `NEXT_PUBLIC_STRIPE_*` / `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | **EMPTY** | Pay + webhooks |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | SET locally | Places / geocode / maps |
| `STRIPE_CONNECT_ENABLED` | MISSING | Real Connect accounts |
| `RESEND_*` / `TWILIO_*` | typically unset | Real email/SMS |

**Vercel:** confirm the same names are set in production (especially Maps + Stripe + service role). Do not commit secrets.

### Payment integrity
- Deposit % via `DEPOSIT_PERCENT` (default 25%).
- Webhook signature verify + `stripe_webhook_events` idempotency in code.
- **Gap (P1):** automatic post-clean balance charge **not implemented** — copy updated to say support settles remaining balance.

### Security / RLS
- Remote tables inspected: RLS **on** for bookings, payments, cleaners, live locations, etc.
- Advisors: many `rls_enabled_no_policy` (**INFO**, default deny); `SECURITY DEFINER` `is_admin` executable by authenticated (**WARN**, P1); leaked password protection **disabled** (**WARN**, P1).
- No service-role keys observed in client bundles during this audit.

### Trust claim audit
| Claim | Finding |
|-------|---------|
| NY / CA live | Config `active: false`; footer shows **Toronto / GTA · Florida / South Florida** only (**PASS**). Admin “today across NY/CA” copy **fixed**. |
| Background check | Explicitly disclaimed in pro/admin onboarding (**PASS**). |
| Insurance / bonding / 24/7 | Not claimed on customer marketing (**PASS**). |
| Fake ratings | No invented AggregateRating counts (**PASS**). |
| “Balance after the clean” as automatic | Was overclaim → **fixed** in FAQ, homepage secure-payments blurb, payment/checkout copy. |
| “Verified professionals” | Means ops review — aligned with anti-BG-check language (**PASS**). |
| GPS as always-on | Live map only for en-route/arrived; homepage preview labeled demo (**PASS**). |

### Mobile / quality
- Sticky footer padding increased; `overflow-x-clip` on booking shell; map preview overflow hardened.
- Quality: lint 0 errors (1 img warning), typecheck OK, 240 tests OK, production build OK.

---

## Problem register

### P0
1. Production Places / Maps JS not loading  
2. Production current location fail (depends on Maps + geolocation)  
3. Stripe checkout + webhooks not proven (keys empty locally; `payments` = 0 remote)  
4. Service role missing locally — verify on Vercel  
5. Cleaner supply = 0  

### P1
1. Automatic remaining-balance charge marketed historically — code gap (copy corrected; implement later)  
2. Stripe Connect payouts stub  
3. Notifications default to log  
4. Admin permissions fail-open / empty `admin_permissions`  
5. Auth leaked-password protection off  
6. `is_admin` SECURITY DEFINER callable by authenticated  
7. Realtime / live GPS unproven e2e  

### P2
1. Push notifications  
2. Empty-policy table hygiene (mostly safe deny)  
3. Function `search_path` mutable warnings  
4. Auto-dispatch productization  

---

## Quick fixes shipped with this audit
- Trust copy: FAQ, homepage secure-payments, payment/checkout deposit wording  
- Admin markets / ops copy: active vs coming soon (NY/CA)  
- Lint: `use-customer-booking-live` ref updates moved into `useEffect`  
- Mobile: booking shell sticky padding + overflow clip; map preview overflow  

---

## Sign-off

**Do not take a paying stranger’s money until P0 #1–#5 are cleared and one full BOOK → PAY → ASSIGN → CLEAN loop is proven on production (or Stripe test mode against production DB) with at least one approved cleaner.**
