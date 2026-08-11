# MaidLinx launch audit

**Date:** 2026-08-11 (re-audit)  
**Branch:** `cursor/live-location-and-booking-ux`  
**Auditor role:** Senior launch engineer (truthful production readiness)  
**Rule:** UI ≠ proven. Every claim below has code, DB, API, or production browser evidence.

**Coordination:** Did not modify Vercel env or trigger redeploy (sibling Maps/env work may be in flight). Production Maps JS **is loading**; Places Autocomplete (New) is still **referrer-blocked**.

---

## Verdict table

| System | Status | Evidence (short) |
|--------|--------|------------------|
| CUSTOMER SYSTEM | **FAIL** | Funnel UI coded; prod booking create `503`; Places suggestions empty; pay unproven; 0 cleaners |
| CLEANER SYSTEM | **FAIL** | Lifecycle + PII authz coded/tested; remote `cleaners` = **0** |
| ADMIN/DISPATCH | **FAIL** | Assign/match APIs coded; cannot prove assign→job without paid booking + supply |
| AUTH | **PASS** | Supabase Auth + role gates; leaked-password protection still **off** (P1) |
| SUPABASE | **PASS** | Project `pgoyhujsfbmfshtnlbnx` **ACTIVE_HEALTHY**; markets 2 / service_zones 6 / bookings 1 |
| RLS/SECURITY | **PASS** | Core tables RLS on; `profiles`/`professionals` views `security_invoker=true` over `users` RLS; advisories = P1 |
| GOOGLE PLACES | **FAIL** | Prod: Maps/Places JS ready, but Autocomplete returns **referrer blocked** for `https://maidlinx.com/` |
| CURRENT LOCATION | **FAIL** | Same Maps/Geocode gate; UI stuck on “Finding your location…” in audit browser (permission + reverse-geocode) |
| STRIPE CHECKOUT | **FAIL** | Local Stripe keys **EMPTY**; remote `payments` = **0**; prod create blocked before pay |
| STRIPE WEBHOOKS | **FAIL** | Handler + `stripe_webhook_events` table exist; **0** events; not e2e-proven |
| CLEANER PAYOUT SYSTEM | **FAIL** | Connect stub unless `STRIPE_CONNECT_ENABLED=true` |
| REAL-TIME STATUS | **FAIL** | State machine + poll/Realtime coded; **not proven** on a live en-route job |
| NOTIFICATIONS | **FAIL** | Local `EMAIL_PROVIDER`/`SMS_PROVIDER` = **log**; Resend/Twilio **MISSING** |
| MOBILE | **PASS** | One-screen `/book/*` + sticky footer; homepage mobile-width snapshot OK; prior 390 clearance |
| TRUST CLAIMS | **PASS** | Footer active markets only; deposit vs balance copy honest; BG-check disclaimed; no AggregateRating |
| PRODUCTION BUILD | **PASS** | `lint` 0 errors (1 img warning), `typecheck`, **240** tests, `npm run build` OK (2026-08-11 re-audit) |

---

## READY TO ACCEPT A REAL CUSTOMER: **NO**

### P0 blockers (exact order)

1. **Production `SUPABASE_SERVICE_ROLE_KEY` missing/empty on Vercel** — `POST https://maidlinx.com/api/bookings` → **503** `SUPABASE_NOT_CONFIGURED` (browser fetch evidence). Booking persist impossible.
2. **Google Places Autocomplete referrer-blocked on production** — `fetchAutocompleteSuggestions` error: `Requests from referer https://maidlinx.com/ are blocked.` Maps JS loads; suggestions UI shows empty / “No matches” for “100 King”. Fix Google Cloud API key **HTTP referrer** allowlist (`https://maidlinx.com/*`, `https://www.maidlinx.com/*`) + Places API (New); do not assume Vercel key alone is enough.
3. **Current location unusable in production** until Geocoding/Places reverse-geocode is allowed for the same referrers (and browser geolocation granted). Manual address remains fallback.
4. **Stripe deposit not proven** — local `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` **EMPTY**; remote `payments` = **0**, `stripe_webhook_events` = **0**. After service role is set, confirm Vercel Stripe TEST keys + one sandbox pay → webhook → confirmed booking.
5. **Zero cleaner supply** — remote `cleaners` count **0** (approved/active also 0). Customers would pay into an empty marketplace.

---

## Fresh production evidence (2026-08-11 re-audit)

### Google Places / Maps (`https://maidlinx.com`)
- `/book/address` and homepage hero load.
- CDP: `google.maps.places` + `AutocompleteSuggestion.fetchAutocompleteSuggestions` **ready**.
- Typing **“100 King”**: suggestions list empty / “No matches”.
- Direct Places call error (definitive): **`Requests from referer https://maidlinx.com/ are blocked.`**
- Sibling note: key appears present (script loads); remaining gate is **Google referrer / API enablement**, not “key totally missing”.

### Current location
- Click “Use my current location” → UI shows **“Finding your location…”** and remained busy through multi-second waits in audit automation (no fill).
- Reverse geocode shares the same Maps key/referrer constraints as Places.

### Booking / payment APIs (production origin)
- `POST /api/bookings` → **503** `{ code: "SUPABASE_NOT_CONFIGURED" }`
- `POST /api/bookings/{uuid}/checkout` → **400** `Missing Supabase admin environment variables.`
- Conclusion: production cannot create or check out bookings until service role is configured on Vercel.

### Supabase remote counts
| Relation | Count |
|----------|------:|
| cleaners | 0 |
| approved cleaners | 0 |
| bookings | 1 (`awaiting_assignment`) |
| payments | 0 |
| stripe_webhook_events | 0 |
| markets | 2 |
| service_zones | 6 |
| profiles (view) | 1 |

### Local `.env.local` (names only)
| Env | State |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` / `ANON` | FOUND |
| `SUPABASE_SERVICE_ROLE_KEY` | EMPTY |
| Stripe publishable / secret / webhook | EMPTY |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | FOUND |
| `STRIPE_CONNECT_ENABLED` | MISSING |
| `EMAIL_PROVIDER` / `SMS_PROVIDER` | FOUND (`log`) |
| `RESEND_API_KEY` / `TWILIO_ACCOUNT_SID` | MISSING |

---

## Area notes

### Customer journey
- **Code:** address → service → property → add-ons → date → time → access → quote → account → PaymentIntent deposit; server `calculateBookingPrice` + `assertPriceMatch`; confirm-payment fallback; post-booking dashboard routes.
- **Prod:** address UI works; Places selection **fails**; booking create **blocked**; Stripe path unproven.

### Cleaner journey
- Onboarding explicitly **not** a background check (correct).
- Job ladder: `on_the_way` → `arrived` → `in_progress` → `completed` with server `validateBookingStatusTransition`.
- Cross-cleaner denial covered in `jobs.authz.test.ts` / `pii.test.ts` (unit evidence).
- **Ops:** no cleaners → marketplace FAIL.

### Admin / dispatch
- Assign + ranked matches behind admin session.
- `admin_permissions` empty → permission loader fail-open to super_admin for admins (**P1**).
- Normal ops coded in-app; cannot prove without paid booking + cleaner.

### Real-time job system
- Canonical transitions in `BOOKING_STATUS_TRANSITIONS` (`pending_payment` → … → `completed`/`cancelled`).
- Customer live hook: Realtime + poll fallback.
- **Unproven** without live assigned job → FAIL for launch table.

### Payment integrity
- Server recalculates + `assertPriceMatch` on create.
- Webhook signature verify + `claimStripeWebhookEvent` idempotency coded; table present; **0** processed events.
- Automatic post-clean balance charge **not** implemented — copy correctly says support settles remaining balance.

### Security / RLS
- `bookings` / `payments` / `cleaners` / `users` RLS enabled with policies.
- `profiles` is a **view** (`security_invoker=true`) over `users` — not a bare RLS-off table leak.
- Advisors: empty-policy tables (default deny) INFO; `is_admin` SECURITY DEFINER callable by authenticated WARN; leaked password protection disabled WARN.
- Signup trigger: admin only via bootstrap email setting — not self-promote from metadata.
- No service-role keys observed in client bundles this audit.

### Trust claim audit
| Claim | Finding |
|-------|---------|
| Markets | Footer: **Toronto / GTA · Florida / South Florida**; NY/CA `active: false` (**PASS**) |
| Background check | Explicitly disclaimed in pro/admin onboarding (**PASS**) |
| Insurance / bonding / fake ratings | Not claimed / no AggregateRating (**PASS**) |
| Deposit vs balance | FAQ + homepage: deposit now; remaining via support (**PASS**) |
| “Verified professionals” | Ops review language (**PASS**) |
| Live GPS always-on | Live map only en-route/arrived; homepage preview labeled demo (**PASS**) |

### Mobile / quality
- Mobile homepage snapshot (narrow viewport) readable; booking path one-decision screens.
- Quality re-run: lint 0 errors, typecheck OK, 240/240 tests, production build OK.
- No lint/typecheck/build failures to fix this pass.

---

## Problem register

### P0
1. Production service role missing → booking create 503  
2. Production Places Autocomplete referrer blocked  
3. Production current location fail (Maps/geocode + permission)  
4. Stripe checkout + webhooks not proven (keys empty locally; payments/events = 0)  
5. Cleaner supply = 0  

### P1
1. Automatic remaining-balance charge not implemented (copy corrected)  
2. Stripe Connect payouts stub  
3. Notifications default to log  
4. Admin permissions fail-open / empty `admin_permissions`  
5. Auth leaked-password protection off  
6. `is_admin` SECURITY DEFINER executable by authenticated  
7. Realtime / live GPS unproven e2e  
8. Auth email rate-limit previously blocked signup (QA report)  

### P2
1. Push notifications  
2. Empty-policy table hygiene (mostly safe deny)  
3. Function `search_path` mutable warnings  
4. Auto-dispatch productization  

---

## What changed vs prior audit today

| Item | Prior | Now |
|------|-------|-----|
| Maps JS on prod | Not loaded | **Loads** (`places` ready) |
| Places suggestions | Dead (no Maps) | Still **FAIL** — referrer blocked |
| Booking create on prod | Suspected | **Confirmed 503** `SUPABASE_NOT_CONFIGURED` |
| `stripe_webhook_events` | Noted missing earlier | **Table exists**; 0 rows |
| Build/tests | PASS | Reconfirmed PASS |

---

## Sign-off

**Do not take a paying stranger’s money until P0 #1–#5 are cleared and one full BOOK → PAY → ASSIGN → CLEAN loop is proven on production (or Stripe test mode against production DB) with at least one approved cleaner.**

**READY TO ACCEPT A REAL CUSTOMER: NO**
