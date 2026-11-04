# SOUTH_FLORIDA booking enabled (founder)

**Date:** 2026-11-04  
**Intent:** Covered South Florida addresses proceed through booking — not stuck on `booking_enabled=false`.

## WHAT_CHANGED

- Config: `SOUTH_FLORIDA.bookingEnabled = true` (`src/config/markets.ts`)
- DB: migration `00035_south_florida_booking_enabled` → `markets.booking_enabled=true` for `SOUTH_FLORIDA`
- `launch_enabled` remains **false** (ads closed)
- `TORONTO_GTA.booking_enabled` remains **false**
- No fake cleaners invented
- Post-pay path already sets `awaiting_assignment` → customer copy “Finding your cleaner”

## Gates (unchanged hard rules)

| Item | Status |
|------|--------|
| Stripe LIVE | **OFF** (local `sk_test` / `pk_test`) |
| After-clean charge model | **NOT flipped** (needs RED approval) |
| BOOKABLE_CLEANERS | Still **0** — HUMAN supply action |
| Non-FL / GTA on Home | waitlist / `out_of_area` |

## HUMAN_ACTION_REQUIRED

Recruit → screen → ops-complete → **≥2 bookable cleaners** in one FL zone so pending matches can convert to real assignments.
