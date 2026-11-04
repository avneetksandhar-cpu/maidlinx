# Agent report — Commercial-first homepage + team selection

**Date:** 2026-11-04  
**SHA:** `dff9dc5`  
**Stripe LIVE:** OFF

## PREVIEW_URL

https://website-ppdd6p9li-maidlinx.vercel.app

## PRODUCTION_URL

https://www.maidlinx.com  
(aliased from `website` project deploy `dpl_HtHH1aBW7qpmx1J6m5srio2zw4Hw`)

## PRODUCTION_SHA

`dff9dc5`

## ROUTES

| Step | Path |
|------|------|
| Commercial home | `/` |
| Property type | `/book/commercial/property` (+ auth twin `/dashboard/book/property`) |
| What needs cleaning | `/book/commercial/service` |
| How often | `/book/commercial/frequency` |
| Preferred time | `/book/commercial/time` (+ `/dashboard/book/time`) |
| Choose team | `/book/commercial/teams` (+ `/dashboard/book/teams`) |
| Checklist | `/dashboard/book/checklist` |
| Review | `/dashboard/book/review` |
| Quote fallback | `/book/commercial/quote` · `/for-business#quote` |
| Residential secondary | `/book/welcome` |
| Office entry alias | `/book?service=office` → commercial property |

Bottom nav: **Home · Bookings · Properties · Account**

## AVAILABLE_TEST / UNAVAILABLE_TEST

| State | Behavior | Verified |
|-------|----------|----------|
| 0 teams | “Try another time” + “Request a quote”; draft notes carried into quote form | Unit + code path (supply=0 → empty) |
| 1 team | Auto-select; Review booking enabled | Unit + component effect |
| Many teams | Card select; turquoise outline + corner check; $/visit; checklist link | Unit + mockup-aligned UI |
| Load failure | Retry | Loader error state |

Interactive mobile E2E with real `commercial_proposals` blocked by BOOKABLE/supply=0.

## BLOCKERS

- Migration `00036_b2b_commercial_fwr.sql` required for proposals/scopes; soft-fails empty when missing.
- No real commercial providers → teams screen stays at zero until proposals exist.
- Stripe LIVE OFF — confirm uses proposal approve / pay-after terms only.
- Reviews/ratings on cards only when real records present (not invented).

## STRIPE_LIVE

**OFF**
