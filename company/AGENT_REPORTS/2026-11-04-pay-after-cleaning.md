# Pay-after-cleaning (Stripe TEST) + post-booking 4-state UX

**Date:** 2026-11-04  
**Branch:** `feature/pay-after-cleaning`  
**STRIPE_LIVE:** **OFF**

## STRIPE_TEST_MODEL

| Step | Behavior |
|------|----------|
| Request checkout | **SetupIntent** saves PaymentMethod (consent). **$0 charged**. |
| Booking advances | `pending_payment` → `awaiting_assignment`, `payment_status=pending`, PM + card brand/last4 stored |
| Cleaner complete | Off-session **PaymentIntent** for **agreed total**, `paymentType=completion` |
| Idempotency | Stripe key `maidlinx_complete_charge_{bookingId}_{totalCents}` + payments row + `payment_status=paid` guard |
| Failed charge | Job stays `completed`; UI shows **Payment needs attention** + Retry |
| LIVE keys | Pay-after **forced OFF** (falls back to deposit) — LIVE remains product-gated OFF |

## SCREENS (`/bookings/[id]`)

1. **REQUESTED** — Finding your cleaner · window · service/extras · agreed total · saved card · charged-after-clean  
2. **CONFIRMED** — Real cleaner name/photo when assigned · window · address/unit  
3. **ON THE WAY / ARRIVED / CLEANING** — Cleaner actions; map/ETA only with real location  
4. **COMPLETE AND PAID** — Checklist · Paid banner only after Stripe success · else payment attention  

Fixture (preview only): `/bookings/ui-fixture?state=requested|confirmed|on_the_way|paid|payment_failed`

## Coordinate

Recurring-discount work lives on `fix/recurring-cleaning-discount` (PR #26 if open). This branch is from `main` after booking-status merge; rebase/merge after #26 lands if both touch review/checkout totals.

## UNVERIFIED (blocked)

- Dual customer+cleaner Stripe TEST E2E (BOOKABLE=0 / market gate / DB may be inactive)
- Live map path with real trip GPS
- In-app Message Maya (messages shell exists; not wired as customer↔cleaner thread on this screen)
- Tips
