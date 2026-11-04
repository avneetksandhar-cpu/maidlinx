# Agent report — Founder Home resume (one primary tap)

**Date:** 2026-11-04  
**Branch:** `feature/founder-booking-polish` (compose with PR #28)  
**Stripe LIVE:** OFF

## STATE → CTA

| State | Priority | One tap | Destination |
|-------|----------|---------|-------------|
| Cleaner on the way / arrived / in progress | 1 (highest) | **View arrival** | `/bookings/[id]` — tracking; live ETA only with fresh location (≤2 min) |
| Upcoming clean (confirmed → accepted) | 2 | **View my clean** | `/bookings/[id]` — appointment, cleaner, entry instructions (real notes) |
| Left mid-booking (session draft) | 3 | **Continue booking** | Furthest unfinished step + `?finish=1` — screen titled **Finish your booking** |
| Want usual again (My Home prefs) | 4 | **Choose a new time** | `/book/date?usual=1` — keep home/service/extras; current price + availability before confirm |

## Real data only

- Resume never invents bookings, cleaners, or ETAs.
- Mid-booking restores `sessionStorage` draft via BookingProvider.
- Usual uses `maidlinx_usual_clean` (My Home prefs).
- Live ETA gated by `isLiveLocationFresh` in `getCustomerLiveLocationView` + LiveCleanerMap.

## Stripe LIVE

**OFF**
