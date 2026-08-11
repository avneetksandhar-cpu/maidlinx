# Current sprint

**Branch:** `cursor/live-location-and-booking-ux`  
**Objective:** Core loop **BOOK → PAY → ASSIGN → CLEAN → COMPLETE → REBOOK** must PASS before any roadmap feature work.  
**AI Booking Assistant:** Sprint 6 — do not implement now.  
**Phase model:** Phase 0 board → Phase 1 core transaction → Phase 2 assign/lifecycle proof → later phases (AI/SEO mass/commercial) gated.

**Scope lock:** This sprint stays **MVP-only**. Expanded ideas in `company/ROADMAP.md` are planning docs — do **not** implement them or interrupt sibling work proving the core loop.

Statuses: **PASS** · **PARTIAL** · **FAIL** · **MISSING** · **NEEDS USER ACTION**

---

## CRITICAL checklist (gate)

| # | Item | Status | Evidence / note |
|---|------|--------|-----------------|
| 1 | Booking flow end-to-end | FAIL | Local create blocked: no service role → `503 SUPABASE_NOT_CONFIGURED` |
| 2 | Maps autocomplete | NEEDS USER ACTION | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` **SET**; Places may need Google Cloud **billing** (manual entry works) |
| 3 | Location capture / service area | PARTIAL | Geolocation + manual fallback in code; markets via `src/config/markets` |
| 4 | Supabase booking storage | NEEDS USER ACTION | Remote schema ready (markets 2 / zones 6 / bookings 1); **local `SUPABASE_SERVICE_ROLE_KEY` EMPTY** |
| 5 | Stripe sandbox deposit + webhook | NEEDS USER ACTION | Checkout + webhook idempotency coded; **Stripe TEST keys EMPTY** in `.env.local` |
| 6 | Confirmation after payment | PARTIAL | UI + webhook + confirm-payment fallback; unverified locally without Stripe |
| 7 | Cleaner portal lifecycle | PARTIAL | Transitions coded; remote **`cleaners` = 0** |
| 8 | Admin assign | PARTIAL | Match + assign APIs exist; needs admin user + paid booking + cleaner |
| 9 | Mobile-usable critical path | PARTIAL | One-decision `/book/*` screens + mobile chrome; not re-verified live this session |
| 10 | Security (secrets / RLS / auth) | PARTIAL | No secrets in git; bookings RLS on; advisor hygiene remains P1 |
| 11 | Production build | PASS | `npm run build` OK (2026-08-11); e2e still env-blocked |

---

## Feature audit (core product)

### CUSTOMER

| Feature | Status | Notes |
|---------|--------|-------|
| Homepage | PASS | Branded hero + book entry |
| Google address autocomplete | NEEDS USER ACTION | Code ready; billing may block Places |
| Current location | NEEDS USER ACTION | `getCurrentPosition` + reverse geocode; same Maps dependency |
| Property selection | PASS | Wired screens |
| Property details | PASS | Beds/baths/size + questions |
| Services | PASS | `src/config/services.ts` |
| Add-ons | PASS | Extras + pricing |
| Date | PASS | Date screen |
| Time | PASS | Arrival windows |
| Access instructions | PASS | Access screen |
| Booking review | PASS | Review + price summary |
| One decision per screen | PASS | `BOOKING_SCREENS` address→…→payment |
| Pricing (server authority) | PASS | `calculateBookingPrice` + `assertPriceMatch` |
| Stripe sandbox payment | NEEDS USER ACTION | Keys empty; TEST only |
| Confirmation | PARTIAL | Needs live pay |
| Matching (customer-facing) | PARTIAL | “Finding pro” UI; dispatch admin/manual |
| Customer account | PARTIAL | Dashboard routes; needs auth session |
| Rebooking | PARTIAL | “Book again” CTAs; not one-tap productized |

### DATABASE

| Feature | Status | Notes |
|---------|--------|-------|
| Supabase connection | PARTIAL | URL + anon **SET**; service role **EMPTY** locally |
| Migrations | PARTIAL | Remote has marketplace statuses, markets/zones, booking columns |
| Booking storage | FAIL (local) | Create requires service role; remote has 1 booking row |
| RLS | PARTIAL | Bookings policies; some empty-policy tables; SECURITY DEFINER views flagged |
| Duplicate booking protection | PARTIAL | Idempotency key + PI reuse + webhook claims; needs e2e proof |

### CLEANER

| Feature | Status | Notes |
|---------|--------|-------|
| Signup / onboarding / profile | PARTIAL | `/earn` + portal paths |
| Availability | PARTIAL | APIs + conflict math |
| Jobs list / detail | PARTIAL | `/cleaner/jobs` |
| EN_ROUTE / ARRIVED / IN_PROGRESS / COMPLETED | PARTIAL | Transition helpers; **0 cleaners** remote |
| Earnings | PARTIAL | UI; Connect payouts stub |

### ADMIN

| Feature | Status | Notes |
|---------|--------|-------|
| Bookings / cleaners / approve | PARTIAL | Admin UI + APIs |
| Cleaner assignment | PARTIAL | Ranked match + assign/offer |
| Payment status | PARTIAL | Depends on Stripe/webhooks |
| Operational status | PARTIAL | Queues incomplete vs roadmap command center |

### MOBILE / VIEWPORTS

| Viewport | Status | Notes |
|----------|--------|-------|
| 375 / 390 / 430 / tablet / desktop | PARTIAL | Responsive booking path coded; live pass blocked by env |

### MARKETPLACE ENGINES (see `MARKETPLACE_SYSTEMS.md`)

| Engine | Status | Notes |
|--------|--------|-------|
| Pricing | PASS | Server authority + tests |
| Markets / zones | PASS | Config + eligibility |
| Duration | PASS | Estimate helpers |
| Availability | PARTIAL | Conflicts live; slot generation later |
| Matching / dispatch | PARTIAL | Code ready; empty supply |
| ETA / reliability / demand / fraud | PARTIAL / stub | Not MVP blockers |

---

## Sprint 1 loop status

| Step | Status |
|------|--------|
| Address → … → Review UI | PASS (code) / PARTIAL (Maps billing) |
| Save booking to Supabase | **FAIL locally** (service role EMPTY) |
| Stripe sandbox pay | **FAIL locally** (Stripe keys EMPTY) |
| Confirmed / awaiting_assignment | PARTIAL (remote sample booking exists) |
| Admin assign | PARTIAL (0 cleaners) |
| Cleaner job ladder | PARTIAL |
| Customer completed + Book again | PARTIAL |

**Core MVP completion (verified e2e):** **~40%**  
(Code coverage ~70–80%; local env + empty supply block proof.)

---

## This sprint — in / out

**In (Phase 1):** Unblock env → prove BOOK→PAY → then assign→clean→complete→rebook · safe schema only · no redesign  
**Out:** Post-MVP `ROADMAP.md` items · AI assistant · Connect live · commercial quoting · growth experiments / SEO mass pages

## Owners

| Area | Role |
|------|------|
| Priority / scope | Product / CEO |
| Implementation | Lead Engineer |
| Release gate | QA + Security |

## Architecture pointers

- `company/ARCHITECTURE.md` — system map + critical path  
- `company/MARKETPLACE_SYSTEMS.md` — pricing / match / availability / duration  
- `company/KNOWN_ISSUES.md` — P0 blockers  

## Notes

- Sibling may touch Supabase/env — do not fight `.env.local`
- Remote project: **Maidlinx** (`pgoyhujsfbmfshtnlbnx`) — ACTIVE_HEALTHY
- Growth docs present under `company/growth/` (MARKET_EXPANSION, KEYWORD_MAP, SEO_ROADMAP, etc.) — leave to Growth
- Leave unused AI draft files alone (`src/lib/booking-assistant/schema.ts`)
- **STOP (2026-08-11):** Phase 1 cannot proceed past booking persist until human sets `SUPABASE_SERVICE_ROLE_KEY` (then Stripe TEST keys)
