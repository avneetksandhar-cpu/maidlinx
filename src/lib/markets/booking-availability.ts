/**
 * Client-safe booking availability helpers (config flags only).
 * Server booking create still enforces via assertMarketBookingEnabled.
 */

import { getMarketById } from "@/config/markets";

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
  const hasAddress = Boolean(opts.line1?.trim() && opts.postalCode?.trim());
  if (!hasAddress) return null;
  if (opts.inServiceArea === false) return "out_of_area";
  if (opts.inServiceArea === true && opts.marketId && !isMarketBookingOpen(opts.marketId)) {
    return "booking_disabled";
  }
  return null;
}
