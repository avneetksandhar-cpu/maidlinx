# Agent report — Founder MaidLinx brand header

**Date:** 2026-11-04  
**Branch:** `feature/founder-booking-polish` (compose with PR #28 tip)  
**Stripe LIVE:** OFF

## COMPONENT_PATH

- `src/components/brand/brand-lockup.tsx` — circular `/brand/maidlinx-mark.png` + **Maid** (white) **Linx** (`#04CED2`)
- `src/components/brand/brand-header.tsx` — shared sticky header (default + compact)

## SCREENS_UPDATED

| Screen | Treatment |
|--------|-----------|
| Home (`/`) | Full lockup left + account |
| Bookings / My Home / Account (`CustomerShell`) | Centered full BrandHeader |
| Booking funnel (`BookingShell`) | Compact lockup so progress + CTA stay visible |
| Multi-property mobile (`BusinessShell`) | Same BrandHeader (trivial) |

## FONTS

System stack throughout: `-apple-system, BlinkMacSystemFont, system-ui, sans-serif`.  
Removed Fraunces / DM Sans Google font loads. Brand name **bold**; titles/buttons **semibold**; body **regular**.

## STRIPE_LIVE

**OFF**
