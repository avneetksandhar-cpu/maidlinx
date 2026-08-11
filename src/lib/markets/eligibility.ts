import {
  getMarketById,
  resolveMarket,
  type MarketResolveInput,
  type MarketResolveResult,
} from "@/config/markets";
import { getServiceById, getServiceByLegacyType, getServiceBySlug } from "@/config/services";

export function resolveMarketOrThrow(input: MarketResolveInput): MarketResolveResult {
  const result = resolveMarket(input);
  // Fail closed: soft country/region matches without a zone are not bookable.
  if (!result.market || !result.inServiceArea || !result.zone) {
    throw new Error("This address is not in a MaidLinx service area.");
  }
  return result;
}

export function isAddressInMarket(input: MarketResolveInput, marketId: string): boolean {
  const result = resolveMarket(input);
  return result.inServiceArea && result.market?.id === marketId;
}

/**
 * Whether a marketplace service is offered in a market.
 * Empty supportedMarkets = all active markets.
 */
export function marketSupportsService(
  marketId: string | null | undefined,
  serviceKey: string | null | undefined,
): boolean {
  if (!serviceKey) return false;
  const service =
    getServiceById(serviceKey) ??
    getServiceBySlug(serviceKey) ??
    getServiceByLegacyType(serviceKey);
  if (!service?.active) return false;
  if (service.supportedMarkets.length === 0) return Boolean(marketId && getMarketById(marketId));
  if (!marketId) return false;
  return service.supportedMarkets.includes(marketId);
}
