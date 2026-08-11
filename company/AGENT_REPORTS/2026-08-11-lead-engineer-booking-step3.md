# Lead Engineer — booking stuck on step 3

**Date:** 2026-08-11  
**Branch:** `cursor/live-location-and-booking-ux`

## What “step 3” is

Progress bar `Step 3 of 10` / `BOOKING_SCREENS[2]` / `BOOKING_FLOW_STEPS` id 3 = **Details** (`/book/details`) — beds/baths/sqft (or commercial restrooms) after Property.

## Root cause

Continue on Details could pass `validateDetailsState` (which coalesces `bedrooms` / `bathrooms` / `squareFootage` with `??` defaults) while `isDetailsComplete` still failed on raw `undefined` values. The service-screen guard then bounced back to Details → felt stuck on step 3.

Primary trigger: URL prefill (`rebook=1`, `q=`, `line1=`) spread `bedrooms: undefined` etc. over the draft and wiped defaults / stored values (repeat-revenue rebook path).

Secondary: partial address patches called `resolveServiceArea` on incomplete fields and wrote `inServiceArea: false` + cleared `marketId` (sticky Continue / false out-of-area while typing).

## Fix (minimal)

1. `definedBookingPatch` + `applyUrlPrefill` — omit undefined prefill keys; still clear schedule on prefill entry.
2. Details Continue persists `validateDetailsState().synced` before navigating to service.
3. `buildAddressStatePatch` — merge patch with current draft; skip service-area resolve until postal or city+region present.
4. Reverse-geocode hard timeout (12s) so “Finding your location…” cannot hang forever.

## Verify

1. `/book/address` → complete in-area address → Property → Details → **Continue** → lands on `/book/service` (Step 4).
2. Optional: open with `?rebook=1&line1=…` without beds/baths/sqft params — Details Continue still advances.
3. `npx vitest run src/lib/bookings/booking-helpers.details.test.ts`

Did not touch Vercel / Maps GCP env (sibling owns that).
