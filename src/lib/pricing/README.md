# Pricing engine

Canonical architecture: [`docs/ALGORITHMS.md`](../../../docs/ALGORITHMS.md) §4.

## Status

**Production MVP.** Used by booking quote / create paths. Do not rewrite this module for speculative features; extend with care.

## Layout

| File | Role |
|------|------|
| `types.ts` | `PriceBreakdown` |
| `config.ts` | Base prices, room/sqft/extra rates, fee %, duration estimate helpers |
| `calculateQuote.ts` | `calculateBookingPrice`, `assertPriceMatch` |
| `calculate.ts` | Re-exports for existing import paths |
| `index.ts` | Public barrel |
| `calculateQuote.test.ts` | Unit tests |

## MVP inputs → outputs

- **In:** service type, bedrooms, bathrooms, square footage, extras  
- **Out:** line-item cents + `totalCents` + optional `estimatedDurationMinutes`

## Later (not implemented here yet)

Frequency discounts, location/zone multipliers, labor/availability surge. Those should call into this module or a thin extension — not fork a second quote engine.

## Related

- Admin pricing helpers: `src/lib/admin/pricing.ts`  
- Duration consumers (future): `src/lib/availability/`, dispatch matching
