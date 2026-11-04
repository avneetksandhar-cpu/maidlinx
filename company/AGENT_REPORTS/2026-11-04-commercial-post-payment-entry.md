# Agent report — Commercial post-payment confirmation + entry instructions

**Date:** 2026-11-04  
**Branch:** `feature/commercial-post-payment-entry`  
**Stripe LIVE:** OFF

## Summary

Commercial approve → `/dashboard/book/status/[bookingId]` now shows confirmation phase, practical visit details, after-hours entry instructions (ACL), and truthful Scheduled / Crew on the way / live map. Home + Bookings deep-link to the same surface. Refresh/reopen is idempotent (existing proposal/order/visit keys).

## ROUTES

| Surface | Path |
|---------|------|
| Post-confirm detail | `/dashboard/book/status/[bookingId]` |
| Home / Bookings → same | `/bookings/[id]` redirects commercial → status |
| Entry API | `GET/POST /api/commercial/entry-instructions` |
| Preview | `/commercial-book-ui-preview?screen=c` |

## Behavior

1. **Confirming your booking** until payment verified (service order exists; Stripe LIVE OFF / $0 due now) **and** team reserved (`professional_profile_id` / assigned+). Auto-refresh every 2.5s; never creates a second charge/booking.
2. **Booking confirmed** → property+suite, team, date, arrival window (local), price/visit, paid today vs future recurring, next visit only when scheduled.
3. **Add entry instructions** — reception / call on arrival / designated entrance + note; this visit or future visits at property. Saved + Edit. Assigned crew only; out of receipts/email.
4. **Scheduled** + window before dispatch; **Crew on the way** only on real `on_the_way`+; map/ETA only with live location data.

## Tests PASSED

- Unit: `confirmation.test.ts` (7), `entry-instructions.test.ts` (3), resume/property-home fixtures updated
- Broader: 78 booking/commercial-related vitest tests green
- `tsc --noEmit` green
- `npm run build` green

## BLOCKERS

- End-to-end Stripe TEST + iPhone browser pass needs auth + real commercial proposal/team (BOOKABLE/supply still constrained). Unit + build verified; live approve path depends on applied migration `00036` + real proposals.
- Sibling owns `/` homepage + `/dashboard/book/teams` — this branch avoided those files.

## STRIPE_LIVE

OFF
