# Agent report — South Florida–only customer Home

**Date:** 2026-11-03  
**Branch:** `feature/fl-home-simplify`  
**Stripe LIVE:** OFF

## Change

Customer Home + booking address first screens are **South Florida only**.

- Copy: “South Florida home cleaning” (no dual GTA+FL price/coverage clutter).
- Address/ZIP outside FL (including recognized TORONTO_GTA) → `out_of_area` waitlist — no GTA booking promise.
- Places autocomplete default bias → Fort Lauderdale / South Florida.
- `CUSTOMER_HOME_MARKET_ID = SOUTH_FLORIDA` in config; GTA remains in `LAUNCH_MARKET_IDS` / DB flags for supply ops.

## Not changed

- Market rows, zone data, TORONTO_GTA flags preserved.
- No invented GTA bookable supply.
- Stripe LIVE remains OFF.

## Verify

- Unit: `booking-availability` (GTA → out_of_area on customer Home) + booking routes.
- Preview: `http://127.0.0.1:3001/`
