import { describe, expect, it } from "vitest";
import {
  assertMarketBookingEnabled,
  getMarketFlagsFromConfig,
  isBookingEnabledForMarket,
  isLaunchEnabledForMarket,
} from "@/lib/markets/flags";
import { calculateBookingPrice } from "@/lib/pricing/calculateQuote";
import { resolveMarket } from "@/lib/markets";
import { marketPricingReady } from "@/lib/pricing/market-prices";

describe("multi-market flags + routing", () => {
  it("keeps booking and launch OFF by default for both launch markets", () => {
    for (const id of ["TORONTO_GTA", "SOUTH_FLORIDA"] as const) {
      const flags = getMarketFlagsFromConfig(id);
      expect(flags?.active).toBe(true);
      expect(flags?.bookingEnabled).toBe(false);
      expect(flags?.launchEnabled).toBe(false);
      expect(isBookingEnabledForMarket(id)).toBe(false);
      expect(isLaunchEnabledForMarket(id)).toBe(false);
    }
  });

  it("resolves GTA → CAD and Florida → USD from address", () => {
    const gta = resolveMarket({
      postalCode: "M5V 2T6",
      city: "Toronto",
      state: "ON",
      country: "CA",
    });
    expect(gta.market?.id).toBe("TORONTO_GTA");
    expect(gta.market?.currency).toBe("CAD");

    const fl = resolveMarket({
      postalCode: "33139",
      city: "Miami Beach",
      state: "FL",
      country: "US",
    });
    expect(fl.market?.id).toBe("SOUTH_FLORIDA");
    expect(fl.market?.currency).toBe("USD");
  });

  it("prices inherit market currency without inventing FL price readiness", () => {
    const gtaQuote = calculateBookingPrice({
      line1: "100 Queen St W",
      serviceType: "standard",
      bedrooms: 2,
      bathrooms: 1,
      squareFootage: 1200,
      extras: [],
      postalCode: "M5V2T6",
      city: "Toronto",
      state: "ON",
      country: "CA",
    });
    expect(gtaQuote.currency).toBe("CAD");

    const flQuote = calculateBookingPrice({
      line1: "100 Ocean Dr",
      serviceType: "standard",
      bedrooms: 2,
      bathrooms: 1,
      squareFootage: 1200,
      extras: [],
      postalCode: "33139",
      city: "Miami",
      state: "FL",
      country: "US",
    });
    expect(flQuote.currency).toBe("USD");
    expect(marketPricingReady("SOUTH_FLORIDA").ready).toBe(false);
    expect(marketPricingReady("TORONTO_GTA").ready).toBe(false);
  });

  it("assertMarketBookingEnabled fails closed", () => {
    expect(() => assertMarketBookingEnabled("TORONTO_GTA")).toThrow(/not enabled/i);
    expect(() => assertMarketBookingEnabled("SOUTH_FLORIDA")).toThrow(/not enabled/i);
  });
});
