# Agent report — Florida-first home simplify

**Date:** 2026-11-03  
**Branch:** `feature/fl-home-simplify`  
**Scope:** Public home first phone screen + waitlist ZIP signal; booking funnel unchanged.

## Done

- HOME_SIMPLIFIED: One street/ZIP field, one mint “Check availability” CTA, navy `#003474` header + white card, FL subtitle copy.
- Dual address+ZIP and dual GTA+FL “from” price clutter removed from first screen.
- Business cleaning + Become a cleaner demoted below residential; My bookings + bottom tab preserved.
- Optional “What’s included in a standard clean?” accordion.
- Honest coverage copy when booking flags OFF / no bookable supply (never invents slots).
- Waitlist reason accepts ZIP-only location signal.

## FLOW_STEPS (existing funnel — extend, not rewrite)

1. Check address (`/` → coverage / waitlist)  
2. Quote (`/book/property` → service → details → addons; live `calculateBookingPrice`)  
3. Choose time (`/book/date` → `/book/time`; unavailable windows disabled)  
4. Review + Stripe TEST pay (`/book/review` → `/book/payment` → confirmation)

## FL_FOCUS

- Primary market messaging: South Florida / USD.  
- GTA recognized honestly as secondary / waitlist when postal resolves there.

## COVERAGE_TRUTH (as of board + config; live DB paused)

| Metric | Value | Source |
|--------|------:|--------|
| `SOUTH_FLORIDA.bookingEnabled` | **false** | `src/config/markets.ts` |
| `TORONTO_GTA.bookingEnabled` | **false** | `src/config/markets.ts` |
| BOOKABLE_CLEANERS (board) | **0** | `LAUNCH_GATE.md` / Current Sprint |
| SOUTH_FLORIDA_COVERAGE_READY | **NO** | Launch Gate |
| TORONTO_GTA_COVERAGE_READY | **NO** | Launch Gate |
| Supabase project | **INACTIVE / paused** | MCP list_projects — SQL not queried this run |

**Full pay E2E:** Blocked by market `bookingEnabled=false` (create → `BOOKING_DISABLED` fail-closed). Stripe LIVE remains OFF. Controlled TEST lifecycle previously proven with temporary flag enable.

## STRIPE_LIVE

**OFF** — hard rule unchanged.

## HUMAN_ACTION_REQUIRED

1. Do **not** enable FL/GTA booking until bookable ≥ 2 same zone.  
2. Optional: restore paused Supabase only if founder wants live coverage SQL refresh.  
3. Supply recruiting remains Growth P0 (FL organic → apps → ops-complete).
