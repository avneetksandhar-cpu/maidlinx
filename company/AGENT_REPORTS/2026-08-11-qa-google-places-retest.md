# QA + Security — Google Places production re-test

**When:** 2026-08-11 ~07:32 UTC  
**Scope:** Live `https://maidlinx.com/book/address` only (autocomplete, current location, reverse geocode). No Stripe / booking / cleaners.

## Results

1. **Autocomplete — FAIL** — `100 King` → “No matches”; `AutocompletePlaces` **403** after ~2.5 min wait + one retry.
2. **Current location — FAIL** — stuck on “Finding your location…”; address fields not filled. Geolocation permission granted but position timeout in automation shell.
3. **Reverse geocoding — FAIL** — no field population from #2; Geocoder probe with known coords returned no callback / no successful geocode response.

## Gate

Do not advance to production `SUPABASE_SERVICE_ROLE_KEY` until Google autocomplete passes on live.
