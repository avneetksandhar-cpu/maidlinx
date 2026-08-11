# Current sprint

**Branch:** `cursor/live-location-and-booking-ux`  
**Objective:** Core loop **BOOK → PAY → ASSIGN → CLEAN → COMPLETE → REBOOK** must PASS before any roadmap feature work.  
**AI Booking Assistant:** Sprint 6 — do not implement now.

**Scope lock:** This sprint stays **MVP-only**. Expanded ideas in `company/ROADMAP.md` are planning docs — do **not** implement them or interrupt sibling work proving BOOK → PAY → ASSIGN → CLEAN → COMPLETE → REBOOK.

Statuses: **PASS** · **PARTIAL** · **FAIL** · **MISSING** · **NEEDS USER ACTION**

---

## CRITICAL checklist (gate)

| # | Item | Status | Evidence / note |
|---|------|--------|-----------------|
| 1 | Booking flow end-to-end | FAIL | Local `POST /api/bookings` → `503 SUPABASE_NOT_CONFIGURED` |
| 2 | Maps autocomplete | NEEDS USER ACTION | Key present; Places needs Google Cloud **billing** (see KNOWN_ISSUES) |
| 3 | Location capture / service area | PARTIAL | Geolocation + manual fallback in code; service areas via `src/config/markets` |
| 4 | Supabase booking storage | NEEDS USER ACTION | Remote schema ready (markets/zones/status); **local `SUPABASE_SERVICE_ROLE_KEY` empty** |
| 5 | Stripe sandbox deposit + webhook | NEEDS USER ACTION | Checkout code live; **Stripe TEST keys empty** in `.env.local` |
| 6 | Confirmation after payment | PARTIAL | UI + webhook path exist; unverified locally without Stripe |
| 7 | Cleaner portal lifecycle | PARTIAL | Transitions coded (`on_the_way`→`arrived`→`in_progress`→`completed`); **0 cleaners** in DB |
| 8 | Admin assign | PARTIAL | Match score + assign APIs exist; needs admin user + paid booking |
| 9 | Mobile-usable critical path | PARTIAL | Mobile booking chrome exists; not re-verified this session |
| 10 | Security (secrets / RLS / auth) | PARTIAL | No secrets in git; bookings RLS on; advisors flag SECURITY DEFINER views + empty-policy tables |
| 11 | Production build | ☐ | Run after env unblocked |

---

## Feature audit (core product)

### CUSTOMER

| Feature | Status | Notes |
|---------|--------|-------|
| Homepage | PASS | Branded hero + book entry; preserve visual direction |
| Google address autocomplete | NEEDS USER ACTION | Code in `address-autocomplete.tsx`; billing may block Places |
| Current location | NEEDS USER ACTION | `getCurrentPosition` + reverse geocode; same Maps billing dependency |
| Property selection | PASS | Property screens/cards wired |
| Property details | PASS | Beds/baths/size + service questions |
| Services | PASS | Catalog in `src/config/services.ts` |
| Add-ons | PASS | Extras screens + pricing |
| Date | PASS | Date screen / schedule selector |
| Time | PASS | Arrival windows |
| Access instructions | PASS | Access screen |
| Booking review | PASS | Review + price summary |
| Pricing (server authority) | PASS | `calculateBookingPrice` + `assertPriceMatch` on create |
| Stripe sandbox payment | NEEDS USER ACTION | Keys empty; TEST only |
| Confirmation | PARTIAL | Confirmation UI; needs live pay |
| Matching (customer-facing) | PARTIAL | “Finding pro” UI; dispatch is admin/manual |
| Customer account | PARTIAL | Dashboard routes exist; needs auth session |
| Rebooking | PARTIAL | “Book again” CTAs exist; not one-tap productized |

### DATABASE

| Feature | Status | Notes |
|---------|--------|-------|
| Supabase connection | PARTIAL | URL + anon set; **service role empty locally** |
| Migrations | PARTIAL | Remote has marketplace statuses, markets (2), zones (6), booking columns; local numbered history ≠ remote timestamps |
| Booking storage | PARTIAL | Remote has ≥1 paid booking; local create blocked |
| RLS | PARTIAL | Bookings have policies; some tables RLS-on/no-policy; SECURITY DEFINER views flagged |
| Duplicate booking protection | PARTIAL | Idempotency key column + PI reuse in checkout; needs e2e proof |

### CLEANER

| Feature | Status | Notes |
|---------|--------|-------|
| Signup | PARTIAL | `/earn` + role paths; onboarding gates |
| Profile | PARTIAL | Portal settings/profile |
| Onboarding | PARTIAL | Documents/capabilities stubs |
| Availability | PARTIAL | Availability + unavailable dates APIs |
| Jobs list | PARTIAL | `/cleaner/jobs` |
| Job detail | PARTIAL | Detail + actions |
| EN_ROUTE (`on_the_way`) | PARTIAL | Transition helpers present |
| ARRIVED | PARTIAL | Transition helpers present |
| IN_PROGRESS | PARTIAL | Transition helpers present |
| COMPLETED | PARTIAL | Transition helpers present |
| Earnings | PARTIAL | Earnings UI; Connect payouts stub |

### ADMIN

| Feature | Status | Notes |
|---------|--------|-------|
| Bookings | PARTIAL | Admin bookings list/detail |
| Cleaners | PARTIAL | List + approve/reject |
| Cleaner approval | PARTIAL | Approve flow |
| Cleaner assignment | PARTIAL | Ranked match + assign/offer |
| Payment status | PARTIAL | Payments views; depends on Stripe/webhooks |
| Operational status | PARTIAL | Queues/ops metrics; Action Required homepage incomplete |

### MOBILE / VIEWPORTS

| Viewport | Status | Notes |
|----------|--------|-------|
| 375px | PARTIAL | Mobile footer/nav present; needs live pass |
| 390px | PARTIAL | Same |
| 430px | PARTIAL | Same |
| Tablet | PARTIAL | Responsive layout assumed; not verified |
| Desktop | PARTIAL | Primary layout works; booking loop blocked by env |

---

## Sprint 1 loop status

| Step | Status |
|------|--------|
| Address → … → Review UI | PARTIAL (code ready) |
| Save booking to Supabase | **FAIL locally** (service role) |
| Stripe sandbox pay | **FAIL locally** (Stripe keys) |
| Confirmed / awaiting_assignment | PARTIAL (remote sample paid booking exists) |
| Admin assign | PARTIAL (0 cleaners seeded) |
| Cleaner job ladder | PARTIAL |
| Customer completed + Book again | PARTIAL |

**Core MVP completion (verified e2e):** **~40%**  
(Code coverage higher; local env + empty supply block proof.)

---

## This sprint — in / out

**In:** Unblock env → prove BOOK→PAY→ASSIGN→CLEAN→COMPLETE→REBOOK · safe schema only · no redesign  
**Out:** All post-MVP `ROADMAP.md` items (refunds, referrals, commercial, gift, dashboards, etc.) · AI assistant · Connect live · commercial quoting · growth experiments

## Owners

| Area | Role |
|------|------|
| Priority / scope | Product / CEO |
| Implementation | Lead Engineer |
| Release gate | QA + Security |

## Notes

- Sibling may touch Supabase/env — do not fight `.env.local`
- Remote project: **Maidlinx** (`pgoyhujsfbmfshtnlbnx`) — ACTIVE_HEALTHY
- Leave unused AI draft files alone (`src/lib/booking-assistant/schema.ts`)
