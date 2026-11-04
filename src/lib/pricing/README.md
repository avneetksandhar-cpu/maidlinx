# Pricing engine

Canonical architecture: [`docs/ALGORITHMS.md`](../../../docs/ALGORITHMS.md) §4.  
**V1 board doc:** [`company/PRICING_ENGINE_V1.md`](../../../company/PRICING_ENGINE_V1.md)

## Status

**Production MVP + Pricing Engine V1.** Dynamic demand/supply is **disabled by default**.

## Layout

| File | Role |
|------|------|
| `types.ts` | `PriceBreakdown` (public) |
| `config.ts` | Base prices, room/sqft/extra rates, fee %, duration |
| `calculateQuote.ts` | `calculateBookingPrice`, `assertPriceMatch` |
| `resolve.ts` | Shared server resolution for quote + create |
| `quotes.ts` | Authoritative quotes + `pricing_quotes` audit |
| `promos.ts` | Server promo validation |
| `experiments.ts` | Sticky A/B (no auto-deploy) |
| `funnel-events.ts` | Privacy-safe funnel persistence |
| `engine/*` | V1 factors, caps, guardrails, discounts, rules |
| `calculate.ts` | Re-exports for existing import paths |
| `index.ts` | Public barrel |

## Authority path

1. Client may call `POST /api/bookings/quote` (rate-limited).
2. `POST /api/bookings` recalculates via `resolveServerPricing` and `assertPriceMatch`.
3. Checkout uses server booking amounts — never browser totals.
4. `calculation_audit` is persisted server-side only.

## Related

- Admin: `/admin/pricing`, `src/app/api/admin/pricing/engine`
- Migration: `supabase/migrations/00024_pricing_engine_v1.sql`
