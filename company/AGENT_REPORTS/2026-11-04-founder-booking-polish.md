# Agent report — Founder 4-panel booking (authoritative visual)

**Date:** 2026-11-04  
**Branch:** `feature/founder-booking-polish`  
**Stripe LIVE:** OFF  
**Compose:** Lands independently of pay-after [#27](https://github.com/avneetksandhar-cpu/maidlinx/pull/27) and recurring [#26](https://github.com/avneetksandhar-cpu/maidlinx/pull/26) — merge order: recurring → pay-after → this polish (or rebase after those land).

## ROUTES

| Panel | Route |
|-------|-------|
| Home | `/` |
| Choose your clean | `/book/service` |
| Make it yours | `/book/details` |
| Choose an arrival | `/book/date` |
| Review | `/book/review` |
| Save your booking | `/sign-in?from=booking&next=/book/review` |

## SCREEN_STATUS

| Screen | Status |
|--------|--------|
| Home | DONE — logo + South Florida, floor-plan art (scales down), Where are we cleaning?, Check availability, What’s included?, bottom nav |
| Choose your clean | DONE — Standard / Deep / Move-out rows + chevron; Compare services |
| Make it yours | DONE — selected service + Edit; beds/baths; extras with prices; sticky total + Choose a time |
| Choose an arrival | DONE — date strip; windows with Earliest available; tap → Review; duration note |
| Review | DONE — address, scope, arrival, total + Edit; payment timing above Request clean |
| Save your booking | DONE — compact gate; email magic link (OAuth only if env flags true) |

## RETURNING_PATHS

| Condition | Home CTA |
|-----------|----------|
| Cleaner on the way / arrived / in progress | **Track my clean** → `/bookings/[id]` |
| Other live upcoming | **View my booking** |
| No live booking + usual clean saved (or past completed) | **Book my usual clean** |

## STRIPE_LIVE

**OFF**
