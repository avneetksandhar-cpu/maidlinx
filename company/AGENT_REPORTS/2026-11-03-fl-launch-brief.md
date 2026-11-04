# Agent report — Florida launch brief (full)

**Date:** 2026-11-03  
**Branch:** `feature/fl-home-simplify`  
**STRIPE_LIVE:** OFF

## TRACE_SUMMARY

Live path (reused): `/` → `/book/address` → property → service → details → addons → date → time → **review** (access skipped) → payment → `/bookings/[id]` → cleaner `/cleaner/jobs/[id]`.

Pricing: real `calculateBookingPrice` / quote API. Windows: requested (supply filter ready via `supplyByWindow`, not invented). Create fail-closes when `bookingEnabled=false`.

## IMPLEMENTED

- Florida-first home: navy header, white card, one address/ZIP, mint Check availability
- Returning: View my booking card (real `/api/dashboard` upcoming) + Book my usual clean
- Bottom nav: Home · Bookings · My Home · Account
- Short forward path: time → review (access optional)
- Honest time copy: Earliest available / Schedule for later; requested windows disclaimer
- Usual clean saved after successful TEST pay

## VERIFIED

- Typecheck + booking-availability / route unit tests (local)
- Full Stripe TEST E2E: **blocked** by market flags + BOOKABLE=0 (see blockers)

## BLOCKERS_SUPPLY

- BOOKABLE_CLEANERS = 0 (board)
- SOUTH_FLORIDA / TORONTO_GTA `bookingEnabled=false`
- Supabase project paused at audit time — live SQL not refreshed

## BLOCKERS_OPS

- Do not enable booking until ≥2 bookable same FL zone
- Founder approval required for Stripe LIVE / market flags
- Slot recheck at checkout + auto next-opening needs supply wiring (not invented)
