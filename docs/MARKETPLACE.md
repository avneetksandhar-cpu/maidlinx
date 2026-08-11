# Multi-service, multi-market marketplace

## Configure markets

Edit [`src/config/markets.ts`](../src/config/markets.ts):

1. Add a `MarketConfig` (`id`/`code`, currency, timezone, center, regions).
2. Add `ServiceZoneConfig` rows with postal prefixes and city fallbacks.
3. Mirror seeds in a follow-up migration (see `00010_markets_services.sql`, `00016_expand_markets_ny_ca.sql`).
4. Prefer resolving addresses via `@/lib/markets` (`resolveMarket`) — never `if (city === "Toronto")`.

Active markets:

| ID | Name | Currency | Timezone |
|---|---|---|---|
| `TORONTO_GTA` | Toronto / GTA (incl. Mississauga, Brampton, Vaughan, Markham, etc.) | CAD | America/Toronto |
| `SOUTH_FLORIDA` | Florida / South Florida | USD | America/New_York |
| `NEW_YORK` | New York | USD | America/New_York |
| `CALIFORNIA` | California | USD | America/Los_Angeles |

Zones match **postal/ZIP prefixes first**, then **city + region** within the market. Soft region match (e.g. FL outside South Florida ZIPs) sets `market` but `inServiceArea: false` — paid booking stays blocked via `resolveMarketOrThrow`.

## Configure services

Edit [`src/config/services.ts`](../src/config/services.ts):

- Catalog fields: `id`, `slug`, `name`, `description`, `icon`, `active`, `pricingModel`, `supportedMarkets`, `requiredQuestions`
- Homepage tiles: `SERVICE_TILES`
- Instant pricing vs quote: `pricingModel: "instant" | "quote"`

App helpers: `@/lib/services/catalog` (`resolveCatalogService`, `validateServiceForMarket`).

## Booking engine

One flow: address → market → service → dynamic questions → schedule → price/quote → customer → payment or quote request → confirmation.

Auth, Stripe checkout, and `createBooking` remain the payment path for instant services. Quote-only services create a `confirmed` booking with `quote_requested` and skip card capture until priced.

## Matching

[`src/lib/matching/`](../src/lib/matching/) — eligibility **before** scoring (`eligibility.ts` → `score.ts` → `rank.ts`).

Phases V1–V4 (Uber principles, not Uber UI): [`MARKETPLACE_ROADMAP.md`](./MARKETPLACE_ROADMAP.md).
Match details: [`MATCHING.md`](./MATCHING.md). Algorithms map: [`ALGORITHMS.md`](./ALGORITHMS.md).
Setup smoke path: [`SETUP_TODAY.md`](../SETUP_TODAY.md).
