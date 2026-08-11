# Post-booking customer experience

**Date:** 2026-08-11  
**Branch:** `cursor/live-location-and-booking-ux`  
**Owner:** Lead Engineer / CX (post-booking surface)

## What shipped

- Canonical post-booking route: `/bookings/[id]` (legacy `/booking/[id]` redirects)
- Payment success uses `bookingStatusPath` → `/bookings/[id]`
- Customer shell (logo header + mobile bottom nav: Home / Bookings / Payment / Help / Account) on account + dashboard + booking detail — **not** on `/book/*`
- Live status card, horizontal timeline (Booked → Confirmed → On the way → Cleaning → Complete), upcoming booking card with real booking fields only
- Realtime subscribe on authorized booking row when Supabase client env exists; always poll fallback
- Map via existing Google Maps + live cleaner location API (only `on_the_way` / `arrived`)
- Message / Call / Track full trip / fake guarantees / invented ratings **hidden**

## Evidence notes

See chat PASS/FAIL table for verification against env.
