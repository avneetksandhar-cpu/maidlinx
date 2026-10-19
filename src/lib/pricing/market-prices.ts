/**
 * Market-specific base prices (architecture).
 * Global SERVICE_BASE_CENTS is the fallback only when a market has no override map.
 * Do not invent Florida USD or Toronto CAD amounts here — founder supplies real prices.
 */

import type { BookingServiceId } from "@/lib/bookings/constants";
import { SERVICE_BASE_CENTS } from "@/lib/pricing/config";

export type MarketPriceTable = Partial<Record<BookingServiceId, number>>;

/**
 * Explicit per-market overrides. Empty object = market uses global cents + market currency
 * until founder provides market-specific amounts (HUMAN_INPUT_REQUIRED).
 */
export const MARKET_SERVICE_BASE_CENTS: Record<string, MarketPriceTable | "HUMAN_INPUT_REQUIRED"> = {
  // Intentionally unset — same global cents billed in CAD until founder confirms GTA price card.
  TORONTO_GTA: {},
  // Intentionally unset — must not silently reuse CAD-tuned globals as Florida USD truth.
  SOUTH_FLORIDA: "HUMAN_INPUT_REQUIRED",
};

export function marketHasExplicitPriceTable(marketId: string | null | undefined): boolean {
  if (!marketId) return false;
  const table = MARKET_SERVICE_BASE_CENTS[marketId];
  if (table === "HUMAN_INPUT_REQUIRED") return false;
  if (!table) return false;
  return Object.keys(table).length > 0;
}

export function marketPricingReady(marketId: string | null | undefined): {
  ready: boolean;
  reason: string;
} {
  if (!marketId) {
    return { ready: false, reason: "No market resolved for pricing." };
  }
  const table = MARKET_SERVICE_BASE_CENTS[marketId];
  if (table === "HUMAN_INPUT_REQUIRED") {
    return {
      ready: false,
      reason: `${marketId} market-specific USD/CAD price card not provided (HUMAN_INPUT_REQUIRED).`,
    };
  }
  if (table && Object.keys(table).length > 0) {
    return { ready: true, reason: "Market-specific base prices configured." };
  }
  if (marketId === "TORONTO_GTA") {
    return {
      ready: false,
      reason:
        "TORONTO_GTA uses global SERVICE_BASE_CENTS in CAD; founder must confirm GTA price card + HST/tax before launch.",
    };
  }
  return {
    ready: false,
    reason: `${marketId} has no market-specific prices; refusing to treat global defaults as launch-ready.`,
  };
}

/** Resolve base cents for a service in a market. Never invents missing market tables as "ready". */
export function getServiceBaseCentsForMarket(
  marketId: string | null | undefined,
  serviceType: BookingServiceId,
): number {
  if (marketId) {
    const table = MARKET_SERVICE_BASE_CENTS[marketId];
    if (table && table !== "HUMAN_INPUT_REQUIRED") {
      const override = table[serviceType];
      if (typeof override === "number" && override >= 0) return override;
    }
  }
  return SERVICE_BASE_CENTS[serviceType] ?? SERVICE_BASE_CENTS.standard;
}
