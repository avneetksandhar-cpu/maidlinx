/**
 * Market resolution for booking, matching, and pricing.
 * Prefer this module over reading config directly in app code.
 */

export {
  MARKETS,
  SERVICE_ZONES,
  LAUNCH_MARKET_IDS,
  getActiveMarkets,
  getMarketByCode,
  getMarketById,
  getMarketBySlug,
  getZoneById,
  getZonesForMarket,
  isLaunchMarketId,
  normalizeCity,
  normalizePostalCode,
  normalizeRegion,
  resolveMarket,
  type LaunchMarketId,
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

export {
  assertMarketBookingEnabled,
  getMarketFlagsFromConfig,
  isBookingEnabledForMarket,
  isLaunchEnabledForMarket,
  loadMarketFlagSnapshots,
  type MarketFlagSnapshot,
} from "@/lib/markets/flags";
