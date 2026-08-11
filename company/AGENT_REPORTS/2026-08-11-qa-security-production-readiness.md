# QA + Security — production readiness gate

**Date:** 2026-08-11  
**Branch:** `cursor/live-location-and-booking-ux`  
**Deliverable:** `company/PRODUCTION_READINESS.md`

## Verdict

**READY FOR CONTROLLED REAL-MONEY LAUNCH: NO**

## ONE human action

Google Cloud project `maidlinx-505202` — add HTTP referrers `https://maidlinx.com/*` and `https://www.maidlinx.com/*` on the Maps browser key (Places New + Maps JS + Geocoding). Production Autocomplete currently returns referrer blocked.

## Evidence highlights

- Production Places CDP: referrer blocked for `https://maidlinx.com/`
- Remote DB: cleaners 0, payments 0, webhook events 0, bookings 1
- Local Stripe + service role: EMPTY
- Quality: lint/typecheck/242 tests/build PASS
- Shipped: legal placeholders (LEGAL REVIEW REQUIRED), address out-of-area false-positive harden, `.env.example` names

## Coordination

Avoided sibling repeat-revenue WIP files. No secrets printed. No push.
