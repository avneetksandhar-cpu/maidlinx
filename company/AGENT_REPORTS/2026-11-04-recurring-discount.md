# Lead Engineer — Recurring cleaning discount (wired end-to-end)

**Date:** 2026-11-04  
**Branch:** `fix/recurring-cleaning-discount`  
**Stripe LIVE:** OFF (unchanged; first-clean deposit still from discounted total)

## DISCOUNT_RATE (configured, honest)

From `DEFAULT_PRICING_RULES` / `src/lib/pricing/recurring-discount.ts`:

| Cadence | Multiplier | Off subtotal |
|---------|------------|--------------|
| weekly | 0.9 | **10%** |
| biweekly | 0.93 | **7%** |
| monthly | 0.97 | **3%** |
| one_time | 1.0 | none |

## Root cause

Engine already applied recurring when `schedule.recurring ≠ one_time`, and booking create passed frequency — but **`buildQuoteInput` omitted `recurringFrequency`**, so quote UI / review / client totals never saw the cut.

## WHERE_APPLIED

1. Quote input schema + `buildQuoteInput` / booking-form quote builder  
2. `calculateBookingPrice` preview (same cut as defaults)  
3. `resolveServerPricing` → engine path when recurring  
4. Quote API response (`discountCents` + `discountLines`)  
5. Review + PriceSummary line: **Recurring discount −$X**  
6. Booking create + deposit PI (unchanged path; now matches quoted discounted `totalCents`)

## TESTS

- `src/lib/pricing/engine/engine.test.ts` — recurring vs one-time  
- `src/lib/pricing/calculateQuote.test.ts` — weekly preview discount  
- vitest: 45 passed in pricing + hardening suites

## Coordination

Did **not** touch `src/config/markets.ts` / FL booking-gate migration (sibling agent 8c1ce802).
