# Marketplace launch audit — 2026-08-14

**Branch:** `split/o-launch-gate` (PR #16)  
**Live:** `maidlinx.com` / `www.maidlinx.com`  
**Production SHA (verified):** `ca3c88faecd50b32e9be181f4d96adb23ea58a63`  
**Mode:** Fresh verification — historical PASS ≠ proof. Stripe LIVE untouched. Content Studio untouched.

---

## STOP GATE (Phase 5)

| Field | Value |
|-------|--------|
| CONTROLLED_TEST_READY | **YES** (lifecycle re-proven locally with temporary TORONTO_GTA `bookingEnabled`; tip/prod flags remain OFF) |
| REAL_MONEY_READY | **NO** |
| P0_BLOCKERS | **0** code/payment; **1** ops before opening markets (BOOKABLE=0) |
| P1_BLOCKERS | **8** (see below) |
| APPROVED_CLEANERS | **1** (`ba902d50-…`, market_id=null) |
| BOOKABLE_CLEANERS | **0** (0 zones / 0 services / 0 availability rows) |
| TORONTO_GTA_COVERAGE | **NO** |
| SOUTH_FLORIDA_COVERAGE | **NO** |
| STRIPE_TEST | **PASS** (fresh lifecycle booking `6f487969-534c-43ce-9eca-c7d54070eff7`, PI `pi_3U4R6zFAmKhvpBtw2XoMG5sK`, `livemode=false`) |
| STRIPE_LIVE | **OFF** (local + policy; no `sk_live`/`pk_live`) |
| CUSTOMER_LIFECYCLE | **PASS** (TEST, temp gate open) / **FAIL-CLOSED** on tip+prod (`BOOKING_DISABLED`) |
| CLEANER_LIFECYCLE | **PASS** (manual offer→accept→assign→complete→rating in TEST) / **NOT auto-match ready** |
| NOTIFICATIONS | **PARTIAL** — `EMAIL_PROVIDER=log` local; Resend historically delivered; SMS=`log` |
| TOP_5_NEXT_ACTIONS | see bottom |
| HUMAN_ACTION_REQUIRED | see bottom |

---

## Phase 1 — Checklist 1–33 (verified 2026-08-14)

| # | Item | Verdict | Evidence |
|---|------|---------|----------|
| 1 | Homepage → booking CTA | **PASS** | Live `/` → `/book` CTAs; hero search |
| 2 | Location detection | **PASS** | Geolocation + Places nearby in address autocomplete |
| 3 | Toronto/GTA vs South Florida | **PASS** | `resolveMarket` + markets config; both active geo |
| 4 | Address autocomplete | **PASS** | Places AutocompleteSuggestion; Maps key present local+prior prod |
| 5 | Saved addresses | **PASS** | Dashboard addresses API + signed-in chips |
| 6 | Service selection | **PASS** | Service catalog + `/book/service` |
| 7 | Residential options | **PASS** | beds/baths/sqft property schema |
| 8 | Commercial lead flow | **PARTIAL** | `/for-business` marketing; office quote-only, no dedicated lead CRM form |
| 9 | Pricing calculation | **PASS** | Server `resolveServerPricing` + `assertPriceMatch`; Toronto quote `totalCents=21275` CAD |
| 10 | Location-based pricing | **PARTIAL** / **HUMAN** | Currency by market OK; FL price card `HUMAN_INPUT_REQUIRED`; `taxCents=0` (no HST) |
| 11 | Recurring pricing | **PASS** | Engine multipliers; UI states no auto-charge |
| 12 | Date/time availability | **PARTIAL** | Windows UI; supply defaults available (not live capacity) |
| 13 | Customer auth | **PASS** | Guest checkout; account optional |
| 14 | Booking creation | **PASS** (gated) | Supabase insert; tip/prod `bookingEnabled=false` → `403 BOOKING_DISABLED` |
| 15 | Stripe TEST checkout | **PASS** | Payment Element + Express Checkout; PI create/reuse |
| 16 | Deposit calculation | **PASS** | 25% deposit; e2e deposit `5319` of `21275` |
| 17 | Webhook handling | **PASS** | Signed webhook 200 + replay dedupe |
| 18 | Booking confirmation | **PASS** | Status `awaiting_assignment`, `payment_status=deposit_paid` |
| 19 | Email notifications | **PARTIAL** | Provider path exists; local `log`; prod Resend historically PASS |
| 20 | Cleaner matching | **PARTIAL** | Offer create works manually; auto-match not supply-ready |
| 21 | Cleaner zones | **FAIL** (data) | Code OK; **0** `cleaner_service_zones` rows |
| 22 | Cleaner availability | **FAIL** (data) | **0** `professional_availability` rows |
| 23 | Cleaner job acceptance | **PASS** | Accept + assignment in TEST lifecycle |
| 24 | Customer booking status | **PASS** | Status screen + post-booking flow |
| 25 | Cleaner completion | **PASS** | Status chain → `completed` |
| 26 | Rating/review | **PASS** | Review `5c5c8fe8-…` created |
| 27 | Admin booking visibility | **PASS** | `/admin` → sign-in; API unauth `401` |
| 28 | Cancellation/refund | **PASS** | Cancel rules + refund helpers present |
| 29 | Terms/privacy consent | **PASS** | Unchecked → `LEGAL_CONSENT_REQUIRED`; checked → checkout |
| 30 | Sentry | **PASS** (prod) | Live health `sentry=true`; local `sentry=false` |
| 31 | Mobile booking UX | **PASS** | Mobile wizard; guest checkout; deposit copy clear |
| 32 | SEO/indexing | **PARTIAL** | Live `robots.txt`/`sitemap.xml` **404**; metadata index true |
| 33 | Fake/unverified claims | **PASS** after fix | Softened “Verified professionals” / “Verified Pro” / “Trusted…” on tip |

### Coverage snapshot (DB, live project)

| Metric | Value |
|--------|------:|
| APPROVED_CLEANERS | 1 |
| BOOKABLE_CLEANERS | 0 |
| cleaner_service_zones | 0 |
| cleaner_services | 0 |
| professional_availability | 0 |
| TORONTO_GTA `booking_enabled` / `launch_enabled` | false / false |
| SOUTH_FLORIDA `booking_enabled` / `launch_enabled` | false / false |
| Service zones configured | 3 per market |
| `launch_waitlist` table | **APPLIED** 2026-08-14 |

---

## Phase 2 — Real customer simulation (Stripe TEST only)

**Method:** Local app `127.0.0.1:3001` + same Supabase + Stripe TEST. Temporarily set TORONTO_GTA `bookingEnabled=true` for the run only; **reverted to false** before commit.

| Step | Result |
|------|--------|
| Landing / quote | PASS — `totalCents=21275` CAD |
| Create booking | PASS — `6f487969-534c-43ce-9eca-c7d54070eff7` |
| Consent block | PASS — `LEGAL_CONSENT_REQUIRED` |
| Checkout + PI reuse | PASS — `pi_3U4R6zFAmKhvpBtw2XoMG5sK`, `reused=true` |
| Stripe pay (`pm_card_visa`) | PASS — `succeeded`, `livemode=false` (confirm needs `return_url` when Link enabled in Dashboard — Payment Element already supplies it) |
| Webhook + dedupe | PASS |
| Payment DB | PASS — 1 payment row; `deposit_paid` |
| Offer → accept → assign | PASS — single active assignment |
| Complete | PASS |
| Rating | PASS |

**Exact failure without temp enable:** `POST /api/bookings` → `403 BOOKING_DISABLED` (intentional).

**Tip/prod customer path today:** quote OK; create blocked until founder enables per-market booking.

---

## Phase 3 — P0 repairs this run

| Fix | Status |
|-----|--------|
| Soft marketing “Verified / Trusted” claim soften | **DONE** (`trust-card`, `booking-preview`, `home-hero`) |
| Apply `00033_launch_waitlist` on Supabase | **DONE** |
| Revert temporary `bookingEnabled` | **DONE** (false) |
| Stripe LIVE / paid services | **NOT touched** |
| Enable market booking flags | **NOT done** (founder gate — coverage RED) |

---

## Phase 4 — Conversion check (high-confidence only)

Inspected mobile funnel: guest checkout already allowed; deposit % shown; recurring copy already disclaims auto-charge. **No cosmetic redesigns.** Only claim-language risk reduced (Phase 3).

Open conversion/ops notes (not auto-fixed):

- Booking intentionally closed → waitlist is the conversion path until coverage GREEN  
- No `robots.txt` / `sitemap.xml` on live  
- Supply windows not live-capacity proven  

---

## P1 open (count = 8)

1. Twilio / SMS still `log`  
2. Cleaner offer push notify incomplete  
3. Offer decline UX  
4. FL USD price card + GTA HST/tax policy  
5. `robots.txt` / `sitemap.xml` missing on live  
6. Founder device proof Apple/Google Pay  
7. Analytics taxonomy gaps  
8. Split PRs `#2–#16` not merged to `main` (prod SHA older than tip for Owner/waitlist UI)

---

## TOP_5_NEXT_ACTIONS

1. Enter **REAL** market/zones/services/availability for cleaner `ba902d50-…` at `/owner/cleaners/[id]` (do not guess market).  
2. Recruit ≥1 additional **bookable** cleaner in the same market (coverage GREEN needs ≥2).  
3. Confirm GTA CAD price card + tax/HST; provide FL USD price card.  
4. When coverage ready, enable `booking_enabled` **per market** independently (keep `launch_enabled` off until supply ready).  
5. Keep Stripe LIVE disabled until explicit founder approval; optional: merge tip → prod after smoke.

## HUMAN_ACTION_REQUIRED

1. Keep Stripe LIVE off.  
2. Complete real cleaner ops + recruit second bookable cleaner.  
3. Confirm market prices / tax.  
4. Flip booking flags only when coverage ready.  
5. Optional: device wallet proof; merge/deploy tip SHA for waitlist UI + claim copy (migration already applied).

**NEW_COST:** $0  
**Content Studio:** untouched  
