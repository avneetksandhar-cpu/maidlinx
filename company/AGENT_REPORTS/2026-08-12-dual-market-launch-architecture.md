# Dual-market launch architecture — TORONTO_GTA + SOUTH_FLORIDA

**Date:** 2026-08-12  
**Branch:** `split/o-launch-gate` (PR #16)  
**Production SHA:** `ca3c88faecd50b32e9be181f4d96adb23ea58a63`  
**Stripe LIVE:** OFF (unchanged)

## Verdict

MaidLinx is **not Toronto-only**. Both launch regions are first-class in config + DB. Neither market is coverage-ready or launch-ready. Approved cleaner has **no market attribution** → `EXISTING_CLEANER_REAL_MARKET = HUMAN_INPUT_REQUIRED`.

## Audit (live Supabase)

| Field | TORONTO_GTA | SOUTH_FLORIDA |
|-------|------------:|--------------:|
| APPROVED_CLEANERS (attributed) | 0 | 0 |
| BOOKABLE_CLEANERS | 0 | 0 |
| SERVICES (catalog) | 9 | 9 |
| ZONES (configured active) | 3–4 | 3 |
| AVAILABILITY rows (cleaner) | 0 | 0 |
| PRICING_READY | NO | NO |
| CURRENCY_READY | YES (CAD) | YES (USD) |
| COVERAGE_READY | NO | NO |
| LAUNCH_READY | NO | NO |
| booking_enabled | false | false |
| launch_enabled | false | false |

- Cleaners total: 2 (1 applicant, 1 approved `ba902d50-…`)
- Approved cleaner: `market_id=null`, 0 zones, 0 services, 0 availability, offline
- Bookings history: TORONTO_GTA 18 (6 completed); SOUTH_FLORIDA 1 (0 completed) — demand signal only, not cleaner home market
- Legacy `service_areas` SF/LA rows deactivated (outside launch set)

## Architecture shipped

1. **Market flags** — `booking_enabled` + `launch_enabled` on `markets` (migration `00032`) + `MarketConfig`; independent; default OFF  
2. **Booking gate** — create booking asserts `booking_enabled` → `403 BOOKING_DISABLED`  
3. **Strict marketplace eligibility** — `src/lib/cleaners/marketplace-eligibility.ts` (approved + active + onboarding + market + zone + service + availability + no overlap + gates)  
4. **Market-specific pricing hook** — `getServiceBaseCentsForMarket` / `MARKET_SERVICE_BASE_CENTS`; FL marked HUMAN_INPUT_REQUIRED; GTA uses global cents until founder confirms  
5. **Owner `/owner/cleaners`** — tabs ALL | TORONTO_GTA | SOUTH_FLORIDA; independent 🔴/🟡/🟢; coverage GREEN needs ≥2 bookable  
6. **Cleaner capabilities** — required market radio + zones filtered to launch markets only  
7. **No Toronto ops bias** — candidate market only from attributed cleaners

## TEST paths

| Path | Result |
|------|--------|
| Address → market → currency (GTA CAD / FL USD) | PASS (unit) |
| Market-specific pricing ready | FAIL (both HUMAN_INPUT) |
| TEST checkout | BLOCKED — `booking_enabled=false` both markets |
| Eligible cleaner → offer | FAIL — 0 bookable / market unknown |

## HUMAN_INPUT_REQUIRED

1. Confirm real market for approved cleaner `ba902d50-…` (TORONTO_GTA or SOUTH_FLORIDA) — do not guess  
2. Complete that cleaner’s zones + services + availability (+ online for auto-offers)  
3. Recruit ≥1 additional bookable cleaner in the same market before coverage GREEN  
4. Confirm TORONTO_GTA CAD price card + tax/HST policy  
5. Provide SOUTH_FLORIDA USD price card (do not reuse CAD-tuned globals as truth)  
6. Explicitly enable `booking_enabled` and/or `launch_enabled` per market when ready (independent)  
7. Keep Stripe LIVE disabled until founder approval  

## Costs

- NEW_PAID_SERVICES: NONE  
- NEW_COST: $0  

## READY_FOR_STRIPE_LIVE_CONFIGURATION: NO
