/**
 * Per-market booking / launch gates.
 * A market can be geo-configured (active) while booking or launch stay OFF.
 */

import {
  getMarketById,
  type MarketConfig,
  MARKETS,
} from "@/config/markets";
import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";

export type MarketFlagSnapshot = {
  marketId: string;
  active: boolean;
  bookingEnabled: boolean;
  launchEnabled: boolean;
  currency: "CAD" | "USD";
  country: "CA" | "US";
  source: "config" | "database" | "merged";
};

function fromConfig(market: MarketConfig): MarketFlagSnapshot {
  return {
    marketId: market.id,
    active: market.active,
    bookingEnabled: market.bookingEnabled,
    launchEnabled: market.launchEnabled,
    currency: market.currency,
    country: market.country,
    source: "config",
  };
}

/** Config-only flags (sync; used by quote/booking hot path when DB unavailable). */
export function getMarketFlagsFromConfig(marketId: string): MarketFlagSnapshot | null {
  const market = getMarketById(marketId);
  return market ? fromConfig(market) : null;
}

export function isBookingEnabledForMarket(marketId: string | null | undefined): boolean {
  if (!marketId) return false;
  const flags = getMarketFlagsFromConfig(marketId);
  return Boolean(flags?.active && flags.bookingEnabled);
}

export function isLaunchEnabledForMarket(marketId: string | null | undefined): boolean {
  if (!marketId) return false;
  const flags = getMarketFlagsFromConfig(marketId);
  return Boolean(flags?.active && flags.launchEnabled);
}

export function assertMarketBookingEnabled(marketId: string | null | undefined): void {
  if (!isBookingEnabledForMarket(marketId)) {
    throw new Error(
      "Booking is not enabled for this market yet. MaidLinx can resolve the address, but checkout is closed until ops enables booking for this market.",
    );
  }
}

/** Prefer DB flags when present; fall back to config. Never invent enablement. */
export async function loadMarketFlagSnapshots(): Promise<MarketFlagSnapshot[]> {
  const configById = new Map(MARKETS.map((m) => [m.id, fromConfig(m)]));

  if (!hasAdminEnv()) {
    return Array.from(configById.values());
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("markets")
    .select("id, active, country, currency, booking_enabled, launch_enabled")
    .limit(50);

  if (error || !data) {
    return Array.from(configById.values());
  }

  const merged = new Map(configById);
  for (const raw of data) {
    const row = raw as {
      id: string;
      active: boolean;
      country: string;
      currency: string;
      booking_enabled?: boolean;
      launch_enabled?: boolean;
    };
    const cfg = configById.get(row.id);
    const currency = (row.currency === "CAD" || row.currency === "USD"
      ? row.currency
      : cfg?.currency) as "CAD" | "USD";
    const country = (row.country === "CA" || row.country === "US"
      ? row.country
      : cfg?.country) as "CA" | "US";

    merged.set(row.id, {
      marketId: row.id,
      active: Boolean(row.active),
      bookingEnabled:
        typeof row.booking_enabled === "boolean"
          ? row.booking_enabled
          : Boolean(cfg?.bookingEnabled),
      launchEnabled:
        typeof row.launch_enabled === "boolean"
          ? row.launch_enabled
          : Boolean(cfg?.launchEnabled),
      currency: currency ?? "USD",
      country: country ?? "US",
      source: cfg ? "merged" : "database",
    });
  }

  return Array.from(merged.values());
}
