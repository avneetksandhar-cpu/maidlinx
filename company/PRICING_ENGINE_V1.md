# Pricing Engine V1

**Status:** Implemented in code (2026-08-11). Dynamic demand/supply pricing is **OFF by default** until an admin enables it in `pricing_rules`.  
**Branch:** `cursor/live-location-and-booking-ux`  
**Do not** enable for real-money customers until QA + Product approve.

## Goals

Server-authoritative quotes with:

1. Multi-factor base pricing (market, service, property, beds/baths, sqft, extras, labor/cost model, travel, complexity, recurring, lead time, day/time, demand, supply, historical duration, min contribution margin)
2. Bounded demand/supply multipliers + min/max caps + global/by-market disable
3. Profit guardrail before quote issuance + full calculation audit per quote
4. Conversion funnel events (anonymous session, UTM, device/browser category for UX — **not** price discrimination)
5. Tables: `pricing_rules`, `pricing_quotes`, `pricing_experiments`, `funnel_events`, `market_demand`, `cleaner_supply`
6. Smart discount stack with max % (promo wired; referral credits remain gated)
7. Experiment framework (assign + metrics; **no auto-deploy winners**)
8. Admin pricing dashboard with real metrics + editable rules
9. Rate-limited quote + funnel endpoints; server validation; `assertPriceMatch` intact
10. Additive migration `00024_pricing_engine_v1.sql`

## Architecture

```
Client preview (non-authoritative)
    → POST /api/bookings/quote  (rate-limited)
         → resolveServerPricing / runPricingEngine
         → persist booking_quotes + pricing_quotes (audit)
         → return public PriceBreakdown only
    → POST /api/bookings
         → resolveServerPricing again
         → assertPriceMatch(clientTotalCents, serverTotal)
         → insert booking
```

**Never trust browser prices. Never return `calculation_audit` to clients.**

### Default posture (launch-safe)

| Flag | Default |
|------|---------|
| `pricing_rules.dynamic_pricing_enabled` | `false` |
| Demand/supply multipliers | `1.0` (ignored) |
| Referral credits | still gated (`REFERRAL_CREDITS_LIVE=false`) |
| Experiment `auto_deploy_winner` | forced `false` in code |

When dynamic is off and booking is one-time with no promo, totals match legacy `calculateBookingPrice` bit-for-bit.

## Key files

| Path | Role |
|------|------|
| `src/lib/pricing/calculateQuote.ts` | Legacy sync calculator + `assertPriceMatch` |
| `src/lib/pricing/engine/*` | V1 factors, caps, guardrails, discounts, rules loader |
| `src/lib/pricing/resolve.ts` | Shared quote/create resolution |
| `src/lib/pricing/quotes.ts` | Authoritative quote + audit persist |
| `src/lib/pricing/experiments.ts` | Sticky A/B assignment + results |
| `src/lib/pricing/funnel-events.ts` | Privacy-safe funnel persistence |
| `src/app/api/bookings/quote/route.ts` | Quote API |
| `src/app/api/analytics/funnel/route.ts` | Funnel ingest |
| `src/app/api/admin/pricing/engine/route.ts` | Admin rules/metrics |
| `src/app/(platform)/admin/pricing/page.tsx` | Admin UI |
| `supabase/migrations/00024_pricing_engine_v1.sql` | Schema |

## Admin

`/admin/pricing` shows:

- 7-day real metrics from `pricing_quotes` / `funnel_events` (empty zeros when no data — no fake demos)
- Editable engine rules (toggle dynamic, bounds, margin floors, discount stack cap)
- Experiment list (observational only)

Service-level `pricing_config` table remains for base rate editing.

## Privacy

- Device/OS/browser category: **UX/tech analytics only** — never used as a pricing factor
- No wealth/race/gender/age discrimination inputs
- Funnel props strip email/phone/address-like keys server-side
- Internal cost/compensation formulas stay in `pricing_quotes.calculation_audit` (RLS, service role)

## Enable dynamic pricing (ops)

1. Apply migration `00024` to the target Supabase project
2. Confirm Stripe remains TEST until Product signs off
3. In Admin → Pricing, enable **Dynamic pricing** on global or a market rule
4. Optionally seed `market_demand` / `cleaner_supply` buckets (neutral `1.0` if empty)
5. QA a full quote → checkout → webhook path in TEST
6. Keep `auto_deploy_winner=false` forever unless Product changes policy in `DECISIONS.md`

## Verification

```bash
npm test -- src/lib/pricing
npm run typecheck
npm run lint
npm run build
```

Booking E2E (address → pay → confirm) still requires local `SUPABASE_SERVICE_ROLE_KEY` + Stripe TEST keys — see `company/CURRENT_SPRINT.md`.
