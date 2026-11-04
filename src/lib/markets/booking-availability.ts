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
  // Street+postal or postal/ZIP-only (home single-field check) can trigger waitlist.
  const hasLocation = Boolean(opts.postalCode?.trim() || opts.line1?.trim());
  if (!hasLocation) return null;
  if (opts.inServiceArea === false) return "out_of_area";
  if (opts.inServiceArea === true && opts.marketId && !isMarketBookingOpen(opts.marketId)) {
    return "booking_disabled";
  }
  return null;
}
