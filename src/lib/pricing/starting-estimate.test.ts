import { describe, expect, it } from "vitest";
import { calculateBookingPrice } from "@/lib/pricing/calculateQuote";
import {
  MARKET_QUOTE_SAMPLES,
  TYPICAL_HOME_QUOTE,
  typicalHomeEstimateForMarket,
} from "@/lib/pricing/starting-estimate";

describe("starting-estimate", () => {
  it("matches calculateBookingPrice for Toronto typical home", () => {
    const marketed = typicalHomeEstimateForMarket("TORONTO_GTA");
    const direct = calculateBookingPrice({
      ...MARKET_QUOTE_SAMPLES.TORONTO_GTA,
      ...TYPICAL_HOME_QUOTE,
    });
    expect(marketed.totalCents).toBe(direct.totalCents);
    expect(marketed.currency).toBe("CAD");
    expect(marketed.totalCents).toBe(21275);
  });

  it("matches calculateBookingPrice for South Florida typical home", () => {
    const marketed = typicalHomeEstimateForMarket("SOUTH_FLORIDA");
    const direct = calculateBookingPrice({
      ...MARKET_QUOTE_SAMPLES.SOUTH_FLORIDA,
      ...TYPICAL_HOME_QUOTE,
    });
    expect(marketed.totalCents).toBe(direct.totalCents);
    expect(marketed.currency).toBe("USD");
    expect(marketed.totalCents).toBe(21275);
  });
});
