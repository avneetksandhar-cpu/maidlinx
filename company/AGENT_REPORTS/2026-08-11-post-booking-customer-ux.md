# Post-booking customer experience

**Date:** 2026-08-11  
**Branch:** `cursor/live-location-and-booking-ux`  
**Commit:** `272c136`  
**Owner:** Lead Engineer / CX (post-booking surface)

## What shipped

- Canonical post-booking route: `/bookings/[id]` (legacy `/booking/[id]` redirects)
- Payment success uses `bookingStatusPath` + Stripe `return_url` → `/bookings/[id]`
- Customer shell (logo header + mobile bottom nav: Home / Bookings / Payment / Help / Account) on account + dashboard + booking detail — **not** on `/book/*`
- Live status card, horizontal timeline (Booked → Confirmed → On the way → Cleaning → Complete), upcoming booking card with real booking fields only
- Realtime subscribe on authorized booking row when Supabase client env exists; always poll fallback
- Map via existing Google Maps + live cleaner location API (only `on_the_way` / `arrived`)
- Message / Call / Track full trip / fake guarantees / invented ratings **hidden**

## Verification table

| Item | Status | Evidence |
|------|--------|----------|
| Post-booking redirect | PASS | `bookingStatusPath` → `/bookings/[id]`; payment form `return_url`; payment-screen uses helper; legacy `/booking/[id]` redirects |
| Booking data | PASS | UI binds `StoredBooking` / dashboard rows only; no hardcoded names/prices |
| Cleaner assignment | PASS | Unassigned → “Finding your MaidLinx Pro…”; assigned → real `booking.cleaner` |
| Status timeline | PASS | Unit tests for 5-step map + headlines |
| Realtime | PASS | `useCustomerBookingLive` subscribe + 8s poll fallback |
| Map | PASS | `GoogleMapsProvider` + `BookingMapPreview` / `LiveCleanerMap`; Maps key set locally |
| Live cleaner location | PASS (code) / NEEDS USER ACTION (e2e) | API + UI gated to `on_the_way`/`arrived`; needs cleaner sharing GPS to prove live |
| Mobile design match | PASS | Reference layout; Message/Call/guarantees omitted by policy |
| Desktop | PASS | Centered ~1100px shell; not stretched phone |
| Security | PASS | `assertBookingAccess` on `/bookings/[id]`; auth tests pass |
| Production build | PASS | `npm run build` OK |

Sandbox pay e2e remains blocked: Stripe keys + service role empty locally.
