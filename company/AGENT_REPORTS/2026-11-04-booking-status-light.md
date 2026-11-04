# Agent report — Post-booking status (light 4-panel system)

**Date:** 2026-11-04  
**Branch:** `feature/booking-status-light-screen`  
**ROUTE:** `/bookings/[id]` (My Bookings → same screen via `routes.bookingDetail`)

## Design tokens

**Path:** `src/styles/brand-tokens.css` → `[data-theme="ml-book"]`  
White / navy `#01193D` / turquoise `#04CED2` / selected `#E6FAFA`  
Applied on booking shell + `LiveJobShell`.

## Screens fixed this PR

- `LiveJobShell` — light chrome, circular mark
- `PostBookingDashboard` — Finding vs Confirmed, help, completion actions
- `LiveStatusCard` — real logo, day-of timeline when assigned
- `BookingDetailsCard` — address/unit/extras/total/payment + today’s clean + help
- `BookingStatusTimeline` — `day_of` variant (Confirmed→…→Complete)
- `UpcomingBookingCard` / Home upcoming — status label + View booking
- `HomeUsualCleanCard` — mounted when no upcoming

## SCREEN_STATUS (authoritative matrix)

| Screen | Status | Notes |
|--------|--------|-------|
| Home | partial→improved | Where are we cleaning?; upcoming date/window/**status**/View booking; usual clean when no upcoming; Business/cleaner secondary |
| Step 1 Address | done | PR #23 |
| Step 2 Choose your clean | partial | Missing editable sqft on Clean panel |
| Step 3 Arrival window | partial | No auto “next real opening” chip (Choose another day only) |
| Step 4 Review and payment | partial | Create **blocked** by `bookingEnabled=false` |
| Booking submitted | done (UI) | Real-record wiring; Finding vs Confirmed; payment separate; next step + help |
| Day of service | partial→improved | Day-of timeline + tasks from real extras; **no cleaner phone** in API (support contact only) |
| Completion and rebooking | partial→improved | Included checklist from booking scope, receipt, Report issue, Book my usual clean |

## Screenshots

- `company/AGENT_REPORTS/booking-status-screenshots/01-pending.png` — Finding your cleaner (UI fixture; not a live row)
- `company/AGENT_REPORTS/booking-status-screenshots/02-confirmed.png` — Confirmed + day-of timeline (UI fixture)

Dev-only fixture route (non-production): `/bookings/ui-fixture?state=pending|confirmed`

## BLOCKED

- **BOOKABLE=0** — `SOUTH_FLORIDA`/`TORONTO_GTA` `bookingEnabled: false` (markets.ts)
- **Supabase project INACTIVE** — cannot query/create TEST bookings for dual-side accept verification
- Live pending/confirmed verification against real rows: blocked until DB + market gate

## PASSED

- Timeline unit tests (`status-timeline.test.ts`)
- Light status UI pending + confirmed (fixture screenshots)
- Design tokens centralized in `src/styles/brand-tokens.css` `[data-theme="ml-book"]`

## STRIPE_LIVE

**OFF**
