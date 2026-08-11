# Lead Engineer — Pricing Engine V1

**Date:** 2026-08-11  
**Branch:** `cursor/live-location-and-booking-ux`  
**Doc:** `company/PRICING_ENGINE_V1.md`

## Shipped

- Additive migration `00024_pricing_engine_v1.sql` (`pricing_rules`, `pricing_quotes`, `pricing_experiments` + assignments, `funnel_events`, `market_demand`, `cleaner_supply`)
- Server engine under `src/lib/pricing/engine/**` with bounded demand/supply, profit guardrail, discount stack
- `resolveServerPricing` shared by quote + booking create; `assertPriceMatch` preserved
- Dynamic pricing **OFF by default** (legacy totals when off / one-time / no promo)
- Quote audit persisted to `pricing_quotes` (never returned to client)
- Funnel API `POST /api/analytics/funnel` (rate-limited, PII stripped)
- Experiments sticky assign + admin results (no auto-deploy)
- Admin `/admin/pricing` engine panel with real metrics / empty states
- Unit tests in `src/lib/pricing/engine/engine.test.ts`

## Avoided

- Checkout / webhook / Stripe / Vercel env / redeploy
- Fake dashboard metrics
- Enabling dynamic pricing or referral credits

## Needs human

- Apply migration `00024` on Supabase when ready
- Local E2E still needs service role + Stripe TEST (existing sprint blockers)
