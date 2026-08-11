/**
 * Service-area resolution — delegates to market/zone config.
 * @see docs/ALGORITHMS.md §7
 */

import {
  resolveMarket,
  type MarketResolveInput,
  type MarketResolveResult,
} from "@/lib/markets";

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface ServiceAreaLookupInput {
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
  location?: GeoPoint;
}

export interface ServiceAreaMatch {
  inServiceArea: boolean;
  areaId?: string;
  areaName?: string;
  marketId?: string;
  marketName?: string;
  zoneId?: string;
  currency?: "CAD" | "USD";
  /** Distance or coverage signal for dispatch (definition TBD). */
  coverageScore?: number;
}

function toMarketInput(input: ServiceAreaLookupInput): MarketResolveInput {
  return {
    postalCode: input.postalCode,
    city: input.city,
    state: input.state,
    country: input.country,
  };
}

/**
 * Resolve address against active markets / service zones.
 */
export function resolveServiceArea(input: ServiceAreaLookupInput): ServiceAreaMatch {
  const result: MarketResolveResult = resolveMarket(toMarketInput(input));
  return {
    inServiceArea: result.inServiceArea,
    areaId: result.zone?.id,
    areaName: result.zone?.name ?? result.market?.name,
    marketId: result.market?.id,
    marketName: result.market?.name,
    zoneId: result.zone?.id,
    currency: result.market?.currency,
    coverageScore: result.inServiceArea ? 1 : result.market ? 0.4 : 0,
  };
}

/**
 * Whether a cleaner covers the job location via assigned zones or travel radius.
 * Zone membership is checked when zoneIds are provided; otherwise soft-pass.
 */
export function cleanerCoversLocation(
  _cleanerId: string,
  input: ServiceAreaLookupInput & { cleanerZoneIds?: string[] },
): ServiceAreaMatch {
  const area = resolveServiceArea(input);
  if (!area.inServiceArea || !area.zoneId) {
    return { ...area, inServiceArea: false, coverageScore: 0 };
  }
  if (input.cleanerZoneIds && input.cleanerZoneIds.length > 0) {
    const covered = input.cleanerZoneIds.includes(area.zoneId);
    return { ...area, inServiceArea: covered, coverageScore: covered ? 1 : 0 };
  }
  return area;
}
