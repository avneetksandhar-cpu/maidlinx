# MaidLinx END-TO-END TEST

**Date:** 2026-08-11  
**Branch:** `cursor/live-location-and-booking-ux`  
**Role:** Lead Engineer  
**Rule:** UI ≠ proven. No faked tracking, ratings, payment, availability, or assignment.

---

## BLOCKED — ONE ACTION

**Paste `SUPABASE_SERVICE_ROLE_KEY` into project-root `.env.local` (never chat/git).**

1. Open Supabase Dashboard → project **Maidlinx** (`pgoyhujsfbmfshtnlbnx`) → **Project Settings → API**  
2. Copy the **`service_role`** secret (not the anon key)  
3. Set in `.env.local`: `SUPABASE_SERVICE_ROLE_KEY=<paste>`  
4. Restart `npm run dev`

Until this is set, `POST /api/bookings` returns **503 `SUPABASE_NOT_CONFIGURED`** and the first test booking cannot persist.

*(Next gates after this, in order: Stripe TEST keys + `stripe listen`; then seed/approve ≥1 cleaner — do not do those until service role works.)*

---

## Verdict

| Checkpoint | Result | Evidence |
|------------|--------|----------|
| Address autocomplete | **FAIL** | Code + local Maps key **SET**; production Places not loading per `LAUNCH_AUDIT.md`; this session no live autocomplete proof |
| Current location | **FAIL** | Geolocation + reverse-geocode coded; depends on Maps; production fail per audit; not proven live here |
| Price calculation | **PASS** (code) | Server `calculateBookingPrice` + `assertPriceMatch` on create/quote; unit tests green |
| Customer auth | **PASS** (code) | Supabase Auth + session gates; middleware role checks present |
| Booking storage | **FAIL** | Local `SUPABASE_SERVICE_ROLE_KEY` **EMPTY** → create blocked; remote has 1 booking row historically |
| Stripe test payment | **FAIL** | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` **EMPTY**; remote `payments` = **0** |
| Stripe webhook | **FAIL** | Handler + signature verify coded; table `stripe_webhook_events` **applied remote this session**; not proven (no paid events / no local secret) |
| Admin receives booking | **FAIL** | Admin bookings UI/API coded; no paid booking created this session |
| Cleaner assignment | **FAIL** | Assign/match APIs coded; remote **`cleaners` = 0** |
| Cleaner receives job | **FAIL** | Jobs list/detail coded; no supply / no assigned job |
| Cleaner accepts job | **FAIL** | `accept` action + transition validation coded; unproven |
| Status updates | **FAIL** | Ladder `on_the_way` → `arrived` → `in_progress` → `completed` enforced server-side; unproven live |
| Customer tracking dashboard | **FAIL** | `/bookings/[id]` live poll + status UI coded; unproven without paid/assigned job |
| Job completion | **FAIL** | `completeJob` → `completed`; unproven |
| Cleaner earnings record | **FAIL** | Earnings derived from completed booking `subtotal_cents` (no separate remote `payouts` table); unproven — Connect payouts stub |
| Customer review | **FAIL** | Submit API + **new** completed-booking review UI wired this session; unproven (needs completed job + auth) |
| RLS/security | **PASS** (code / remote) | RLS on core tables; no service-role/Stripe secrets in client; status transitions + review authz enforced; advisor hygiene remains P1 |
| Mobile 390px | **PASS** (code / prior audit) | One-decision `/book/*` + sticky footer; prior audit clearance; not re-browsered this session |
| Production build | **PASS** | `npm run lint` (0 errors), `typecheck`, **240** tests, `npm run build` OK (2026-08-11) |

### READY FOR FIRST TEST BOOKING: **NO**

---

## Env snapshot (names only — no values)

| Variable | Local `.env.local` |
|----------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` / `ANON` | **SET** |
| `SUPABASE_SERVICE_ROLE_KEY` | **EMPTY** ← active stop |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | **EMPTY** |
| `STRIPE_SECRET_KEY` | **EMPTY** |
| `STRIPE_WEBHOOK_SECRET` | **EMPTY** |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | **SET** |
| `STRIPE_CONNECT_ENABLED` | **MISSING** (Connect stub OK for MVP deposit) |

Remote (MCP): bookings **1**, cleaners **0**, payments **0**, reviews **0**, assignments **0**.  
`stripe_webhook_events` created remotely this session (additive migration).

---

## Critical path map (code — not e2e proven)

| Step | Status after pay / ops | Implementation |
|------|------------------------|----------------|
| Create booking | `pending_payment` | `POST /api/bookings` + server price |
| Stripe PI deposit | — | `POST /api/bookings/[id]/checkout` |
| Confirm | `awaiting_assignment` + `payment_status=deposit_paid` + `payments` row | Webhook and/or `confirm-payment` |
| Admin assign | `assigned` | `PATCH /api/admin/bookings/[id]` |
| Cleaner ladder | accept → on_the_way → arrived → in_progress → completed | `PATCH /api/pro|cleaner/jobs/[id]` |
| Review | `reviews` row | `POST /api/dashboard/reviews` + UI on completed `/bookings/[id]` |
| Earnings | completed booking subtotal | `/cleaner/earnings` / pro earnings summary |

Canonical post-pay status is **`awaiting_assignment`** (matching queue), not a separate `MATCHING` enum. Paid deposit state is **`deposit_paid`** (not a literal `PAID` string).

---

## Security checklist (must hold)

| Requirement | Status |
|-------------|--------|
| Authoritative server pricing | **HOLD** (code + tests) |
| Stripe verified server/webhook | **CODE HOLD** / **UNPROVEN** live |
| No duplicate bookings/payments | **CODE HOLD** (PI reuse + webhook claim table now remote) |
| Allowed status transitions | **HOLD** (server validation) |
| RLS | **HOLD** (remote enabled; empty-policy = default deny) |
| No service-role / Stripe secrets client-side | **HOLD** |
| No cross-customer/cleaner access | **HOLD** (access helpers + session gates) |
| No self-admin promotion | **HOLD** (admin gated; permissions P1 hygiene) |

---

## Ordered FAIL / P0 list

1. **`SUPABASE_SERVICE_ROLE_KEY` EMPTY** — booking create 503 (ONE ACTION above)  
2. **Stripe TEST keys EMPTY** — checkout/webhook cannot run locally  
3. **Zero cleaners** — cannot assign → accept → complete ladder  
4. **Address autocomplete / current location** — not proven (Maps/prod billing risk)  
5. **No live paid booking** — admin receive, tracking, completion, earnings, review all unproven  

---

## Code shipped this session (minimal)

- Remote additive: `public.stripe_webhook_events` (+ RLS enabled)  
- Customer review UI on completed booking dashboard + `GET /api/dashboard/reviews`  
- Quality: lint 0 errors, typecheck, 240 tests, build **PASS**

---

## What was NOT done

- Did not invent cleaners, fake payments, or fake reviews  
- Did not fight sibling edits to `.env.local` / Vercel Maps  
- Did not expand into growth / AI / redesign  

**After the ONE ACTION:** restart dev → retry create booking → then add Stripe TEST keys per `docs/STRIPE_SETUP.md` → seed one approved cleaner → re-run this checklist to flip READY to YES.
