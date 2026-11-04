# Agent report — Commercial book mockup UX (3 screens)

**Date:** 2026-11-04  
**Branch:** `feature/commercial-book-mockup-ux`  
**Stripe LIVE:** OFF

## PREVIEW_URL

http://127.0.0.1:3001/commercial-book-ui-preview?screen=a  
(Auth product path: http://127.0.0.1:3001/dashboard/book)

## ROUTES

| Screen | Path |
|--------|------|
| A Book entry | `/dashboard/book` |
| Property step | `/dashboard/book/property` |
| Service step | `/dashboard/book/service` |
| Frequency step | `/dashboard/book/frequency` |
| B Choose team | `/dashboard/book/teams` |
| Checklist | `/dashboard/book/checklist` |
| Review (+ recurring price) | `/dashboard/book/review` |
| C Crew status | `/dashboard/book/status/[bookingId]` |
| UI preview (no auth) | `/commercial-book-ui-preview?screen=a\|b\|c` |

Buyer tabs remain Overview · Sites · Jobs · Billing. Book flow is the primary commercial entry from Overview.

## REAL_DATA_SOURCES

| UI | Source |
|----|--------|
| Properties | `customer_addresses` / saved addresses via `listSavedAddresses` |
| Scope / checklist areas | `commercial_site_scopes` via `getScopeForSite` + `POST /api/commercial/scopes` |
| Teams / prices | `commercial_proposals` via `listProposalsForSite` / `GET /api/commercial/proposals` |
| Fallback teams | Real upcoming `bookings` for matching site address (assigned crew only) |
| Confirm | `PATCH /api/commercial/proposals` → `approveProposal` → `service_orders` + first visit booking |
| Status | `bookings` via `getBookingForCustomer` |
| Live map / ETA | `cleaner_live_locations` only when status is on_the_way/arrived + consented share — never simulated |

## SCREENSHOT_PATHS

- `company/AGENT_REPORTS/evidence/commercial-book-mockup/screen-a-book-home.png`
- `company/AGENT_REPORTS/evidence/commercial-book-mockup/screen-b-choose-team.png`
- `company/AGENT_REPORTS/evidence/commercial-book-mockup/screen-c-crew-status.png`

## BLOCKERS (supply=0)

- No eligible teams until real `commercial_proposals` (sent/awaiting_approval/approved) or assigned bookings exist for the site.
- Live map / ETA blocked until an assigned crew shares consented live location.
- Message crew routes to support until in-app crew messaging ships.
- Migration `00036_b2b_commercial_fwr.sql` must be applied for proposals/scopes tables; code soft-fails to empty when tables missing.
- Stripe LIVE remains OFF.
