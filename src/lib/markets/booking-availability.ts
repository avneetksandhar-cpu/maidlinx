/**
 * Client-safe booking availability helpers (config flags only).
 * Server booking create still enforces via assertMarketBookingEnabled.
 */

import {
  CUSTOMER_HOME_MARKET_ID,
  getMarketById,
  isCustomerHomeMarket,
} from "@/config/markets";

export function isMarketBookingOpen(marketId: string | null | undefined): boolean {
  if (!marketId) return false;
  const market = getMarketById(marketId);
  return Boolean(market?.active && market.bookingEnabled);
}

export type WaitlistReason = "out_of_area" | "booking_disabled";

export function resolveWaitlistReason(opts: {
  line1?: string | null;
  postalCode?: string | null;
  inServiceArea?: boolean;
  marketId?: string | null;
}): WaitlistReason | null {
  // Street+postal or postal/ZIP-only (home single-field check) can trigger waitlist.
  const hasLocation = Boolean(opts.postalCode?.trim() || opts.line1?.trim());
  if (!hasLocation) return null;
  if (opts.inServiceArea === false) return "out_of_area";
  if (opts.inServiceArea === true && opts.marketId && !isMarketBookingOpen(opts.marketId)) {
    return "booking_disabled";
  }
  return null;
}

/**
 * Customer Home / booking first screens: only SOUTH_FLORIDA is “in market.”
 * Recognized GTA (and any other market) → out_of_area waitlist — no GTA booking promise.
 * Market rows/flags stay intact for supply ops.
 */
export function resolveCustomerHomeWaitlistReason(opts: {
  line1?: string | null;
  postalCode?: string | null;
  inServiceArea?: boolean;
  marketId?: string | null;
}): WaitlistReason | null {
  const hasLocation = Boolean(opts.postalCode?.trim() || opts.line1?.trim());
  if (!hasLocation) return null;

  const outsideLaunch =
    opts.inServiceArea === false ||
    (opts.marketId != null && !isCustomerHomeMarket(opts.marketId)) ||
    (opts.inServiceArea === true && !opts.marketId);

  if (outsideLaunch) return "out_of_area";

  if (
    opts.inServiceArea === true &&
    isCustomerHomeMarket(opts.marketId) &&
    !isMarketBookingOpen(CUSTOMER_HOME_MARKET_ID)
  ) {
    return "booking_disabled";
  }

  return null;
}

export function isCustomerHomeBookableArea(opts: {
  inServiceArea?: boolean;
  marketId?: string | null;
}): boolean {
  return Boolean(opts.inServiceArea && isCustomerHomeMarket(opts.marketId));
}
