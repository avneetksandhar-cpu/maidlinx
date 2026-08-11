/**
 * Market resolution for booking, matching, and pricing.
 * Prefer this module over reading config directly in app code.
 */

export {
  MARKETS,
  SERVICE_ZONES,
  getActiveMarkets,
  getMarketByCode,
  getMarketById,
  getMarketBySlug,
  getZoneById,
  getZonesForMarket,
  normalizeCity,
  normalizePostalCode,
  normalizeRegion,
  resolveMarket,
  type MarketConfig,
  type MarketResolveInput,
  type MarketResolveResult,
  type ServiceZoneConfig,
} from "@/config/markets";

export {
  isAddressInMarket,
  marketSupportsService,
  resolveMarketOrThrow,
} from "@/lib/markets/eligibility";
