# STRIPE_MODEL_FLAG — deposit upfront vs charge-after-clean

**Date:** 2026-11-04  
**Status:** **SUPERSEDED 2026-11-04** — founder approved pay-after in Stripe TEST. See `2026-11-04-pay-after-cleaning.md`.

## Intended (founder brief)

Consent at request → charge **agreed total AFTER clean completes**.

## Current production/TEST code

| Behavior | Evidence |
|----------|----------|
| **Charges deposit UPFRONT at request** | `POST /api/bookings/[id]/checkout` creates PaymentIntent with `amount: depositCents` (default **50%** of total via `calculateDepositCents`) and **automatic capture** (no `capture_method: "manual"`) |
| Balance “after the job” | Product copy only — **no** completion webhook / job-complete charge of remaining balance found |
| Idempotent checkout | Yes — `idempotencyKey: maidlinx_checkout_${bookingId}_${depositCents}` + PI reuse |

## Auth explanation

- Not a Stripe SetupIntent / authorize-only hold today.
- Customer pays a **deposit PI** that succeeds at checkout; booking moves to paid statuses.
- Remaining total is **not** auto-captured on `complete` today.

## Recommendation

Do **not** flip production checkout to after-clean without an explicit founder RED approval + migration plan (SetupIntent or `capture_method: manual` auth + capture on complete, refunds, far-future bookings, declined-pay recovery).

## STRIPE_LIVE

**OFF**
