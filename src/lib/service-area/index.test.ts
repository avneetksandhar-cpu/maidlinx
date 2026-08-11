import { describe, expect, it } from "vitest";
import { resolveServiceArea } from "@/lib/service-area";

describe("resolveServiceArea", () => {
  it("resolves Toronto postal prefixes to Toronto / GTA", () => {
    const result = resolveServiceArea({
      postalCode: "M5V 2T6",
      city: "Toronto",
      state: "ON",
      country: "CA",
    });
    expect(result.inServiceArea).toBe(true);
    expect(result.marketId).toBe("TORONTO_GTA");
    expect(result.currency).toBe("CAD");
  });

  it("resolves GTA municipalities (Mississauga) to Toronto / GTA", () => {
    const result = resolveServiceArea({
      postalCode: "L5B 4M2",
      city: "Mississauga",
      state: "ON",
      country: "CA",
    });
    expect(result.inServiceArea).toBe(true);
    expect(result.marketId).toBe("TORONTO_GTA");
    expect(result.currency).toBe("CAD");
  });

  it("resolves Miami ZIP prefixes to Florida / South Florida", () => {
    const result = resolveServiceArea({
      postalCode: "33101",
      city: "Miami",
      state: "FL",
      country: "US",
    });
    expect(result.inServiceArea).toBe(true);
    expect(result.marketId).toBe("SOUTH_FLORIDA");
    expect(result.currency).toBe("USD");
  });

  it("rejects San Francisco while California market is inactive", () => {
    const result = resolveServiceArea({
      postalCode: "94105",
      city: "San Francisco",
      state: "CA",
      country: "US",
    });
    expect(result.inServiceArea).toBe(false);
    expect(result.marketId).toBeUndefined();
  });

  it("rejects Seattle (out of area)", () => {
    const result = resolveServiceArea({
      postalCode: "98101",
      city: "Seattle",
      state: "WA",
      country: "US",
    });
    expect(result.inServiceArea).toBe(false);
    expect(result.marketId).toBeUndefined();
  });
});
