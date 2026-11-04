# Agent report — Customer booking 4-panel flow

**Date:** 2026-11-04  
**Branch:** `feature/fl-home-simplify`  
**Scope:** Light 4-step customer booking UX matching founder design panels. Reuses Places, quote, availability windows, Stripe TEST checkout.

## Done

- **4 panels = 4 screens:** Address → Clean (`/book/service`) → When (`/book/date`) → Review → Pay
- Design tokens exact: white / navy `#01193D` / turquoise `#04CED2` / selected `#E6FAFA`
- Circular `public/brand/maidlinx-mark.png`; Step X of 4 progress
- Address check before sign-in; auth only at payment
- Clean panel: real Standard/Deep + beds/baths + extras with prices + live USD total + recurring preference
- When panel: earliest opening + real arrival windows (“Arrives …”) + choose another day + duration + optional instructions; no invented slots
- Review: edit links return with `?from=review`; quote refresh; deposit timing copy
- Post-checkout headlines: “Finding your cleaner” vs “Confirmed” only when assigned
- Language switcher omitted (no full ES flow)
- Stripe LIVE remains OFF (`sk_test` / markets `bookingEnabled=false`)

## Routes

| Step | Path |
|------|------|
| 1 Where | `/book/address` |
| 2 Clean | `/book/service` |
| 3 When | `/book/date` |
| 4 Review | `/book/review` |
| Pay | `/book/payment` |

Legacy `/book/property|details|addons|time|access` redirect into consolidated panels.

## Screenshots

- `company/AGENT_REPORTS/booking-4panel-screenshots/01-address.png`
- `company/AGENT_REPORTS/booking-4panel-screenshots/02-clean.png`
- `company/AGENT_REPORTS/booking-4panel-screenshots/03-when.png`
- `company/AGENT_REPORTS/booking-4panel-screenshots/04-review.png`

## BLOCKED

- Full Stripe TEST create → pay E2E: `SOUTH_FLORIDA.bookingEnabled=false` (BOOKABLE=0 / Launch Gate). Quote UI + deposit copy work; booking create fail-closed until founder enables market after coverage.

## STRIPE_LIVE

**OFF**
