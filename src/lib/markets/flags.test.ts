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
  it("enables South Florida booking while keeping GTA + launch ads closed", () => {
    const gta = getMarketFlagsFromConfig("TORONTO_GTA");
    expect(gta?.active).toBe(true);
    expect(gta?.bookingEnabled).toBe(false);
    expect(gta?.launchEnabled).toBe(false);
    expect(isBookingEnabledForMarket("TORONTO_GTA")).toBe(false);
    expect(isLaunchEnabledForMarket("TORONTO_GTA")).toBe(false);

    const fl = getMarketFlagsFromConfig("SOUTH_FLORIDA");
    expect(fl?.active).toBe(true);
    expect(fl?.bookingEnabled).toBe(true);
    expect(fl?.launchEnabled).toBe(false);
    expect(isBookingEnabledForMarket("SOUTH_FLORIDA")).toBe(true);
    expect(isLaunchEnabledForMarket("SOUTH_FLORIDA")).toBe(false);
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

  it("assertMarketBookingEnabled fails closed for GTA and allows South Florida", () => {
    expect(() => assertMarketBookingEnabled("TORONTO_GTA")).toThrow(/not enabled/i);
    expect(() => assertMarketBookingEnabled("SOUTH_FLORIDA")).not.toThrow();
  });
});
