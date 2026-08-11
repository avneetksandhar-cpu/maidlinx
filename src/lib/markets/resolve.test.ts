import { describe, expect, it } from "vitest";
import { resolveMarket, getMarketByCode, getActiveMarkets } from "@/lib/markets";
import { marketSupportsService, resolveMarketOrThrow } from "@/lib/markets/eligibility";

describe("resolveMarket", () => {
  it("resolves Toronto postal to TORONTO_GTA + zone", () => {
    const result = resolveMarket({
      postalCode: "M5V 2T6",
      city: "Toronto",
      state: "ON",
      country: "CA",
    });
    expect(result.market?.code).toBe("TORONTO_GTA");
    expect(result.market?.currency).toBe("CAD");
    expect(result.market?.timezone).toBe("America/Toronto");
    expect(result.zone?.id).toBe("zone_toronto_core");
    expect(result.inServiceArea).toBe(true);
  });

  it("resolves Mississauga (GTA) to TORONTO_GTA", () => {
    const result = resolveMarket({
      postalCode: "L5B 4M2",
      city: "Mississauga",
      state: "ON",
      country: "CA",
    });
    expect(result.market?.id).toBe("TORONTO_GTA");
    expect(result.market?.currency).toBe("CAD");
    expect(result.zone?.id).toBe("zone_gta_west");
    expect(result.inServiceArea).toBe(true);
  });

  it("resolves Brampton (GTA) to TORONTO_GTA", () => {
    const result = resolveMarket({
      postalCode: "L6Y 1M1",
      city: "Brampton",
      state: "ON",
      country: "CA",
    });
    expect(result.market?.id).toBe("TORONTO_GTA");
    expect(result.zone?.id).toBe("zone_gta_west");
    expect(result.inServiceArea).toBe(true);
  });

  it("resolves Vaughan / Markham style GTA cities via config (no city hardcodes)", () => {
    const vaughan = resolveMarket({
      postalCode: "L4K 1A1",
      city: "Vaughan",
      state: "ON",
      country: "CA",
    });
    expect(vaughan.market?.id).toBe("TORONTO_GTA");
    expect(vaughan.inServiceArea).toBe(true);

    const markham = resolveMarket({
      city: "Markham",
      state: "ON",
      country: "CA",
    });
    expect(markham.market?.id).toBe("TORONTO_GTA");
    expect(markham.zone?.id).toBe("zone_gta_east");
    expect(markham.inServiceArea).toBe(true);
  });

  it("resolves Miami ZIP to SOUTH_FLORIDA", () => {
    const result = resolveMarket({
      postalCode: "33139",
      city: "Miami Beach",
      state: "FL",
      country: "US",
    });
    expect(result.market?.code).toBe("SOUTH_FLORIDA");
    expect(result.market?.name).toMatch(/Florida/i);
    expect(result.market?.currency).toBe("USD");
    expect(result.zone?.id).toBe("zone_miami_dade");
    expect(result.inServiceArea).toBe(true);
  });

  it("resolves Boca Raton to SOUTH_FLORIDA Palm Beach zone", () => {
    const result = resolveMarket({
      postalCode: "33432",
      city: "Boca Raton",
      state: "FL",
      country: "US",
    });
    expect(result.market?.code).toBe("SOUTH_FLORIDA");
    expect(result.inServiceArea).toBe(true);
    expect(result.zone?.id).toBeTruthy();
  });

  it("does not book NYC while NEW_YORK is inactive", () => {
    const result = resolveMarket({
      postalCode: "10001",
      city: "New York",
      state: "NY",
      country: "US",
    });
    expect(result.inServiceArea).toBe(false);
    expect(result.market).toBeNull();
  });

  it("does not book Los Angeles while CALIFORNIA is inactive", () => {
    const result = resolveMarket({
      postalCode: "90012",
      city: "Los Angeles",
      state: "CA",
      country: "US",
    });
    expect(result.inServiceArea).toBe(false);
    expect(result.market).toBeNull();
  });

  it("does not book San Francisco while CALIFORNIA is inactive", () => {
    const result = resolveMarket({
      postalCode: "94105",
      city: "San Francisco",
      state: "CA",
      country: "US",
    });
    expect(result.inServiceArea).toBe(false);
    expect(result.market).toBeNull();
  });

  it("rejects unsupported regions (e.g. Seattle)", () => {
    const result = resolveMarket({
      postalCode: "98101",
      city: "Seattle",
      state: "WA",
      country: "US",
    });
    expect(result.market).toBeNull();
    expect(result.inServiceArea).toBe(false);
  });

  it("exposes only Toronto/GTA and South Florida as active customer markets", () => {
    expect(getMarketByCode("TORONTO_GTA")?.slug).toBe("toronto-gta");
    expect(getMarketByCode("SOUTH_FLORIDA")?.slug).toBe("south-florida");
    expect(getMarketByCode("NEW_YORK")?.active).toBe(false);
    expect(getMarketByCode("CALIFORNIA")?.active).toBe(false);
    expect(getActiveMarkets().map((m) => m.id)).toEqual(["TORONTO_GTA", "SOUTH_FLORIDA"]);
  });
});

describe("marketSupportsService", () => {
  it("allows residential across active seeded markets", () => {
    expect(marketSupportsService("TORONTO_GTA", "standard")).toBe(true);
    expect(marketSupportsService("SOUTH_FLORIDA", "residential")).toBe(true);
  });

  it("rejects unknown services", () => {
    expect(marketSupportsService("TORONTO_GTA", "spaceship_detail")).toBe(false);
  });
});

describe("resolveMarketOrThrow", () => {
  it("returns market+zone for in-service addresses", () => {
    const result = resolveMarketOrThrow({
      postalCode: "M5V 2T6",
      city: "Toronto",
      state: "ON",
      country: "CA",
    });
    expect(result.inServiceArea).toBe(true);
    expect(result.zone?.id).toBeTruthy();
  });

  it("throws for soft-matched FL regions without a South Florida zone", () => {
    expect(() =>
      resolveMarketOrThrow({
        postalCode: "32099",
        city: "Jacksonville",
        state: "FL",
        country: "US",
      }),
    ).toThrow(/not in a MaidLinx service area/i);
  });

  it("throws for out-of-area addresses (blocks paid booking)", () => {
    expect(() =>
      resolveMarketOrThrow({
        postalCode: "98101",
        city: "Seattle",
        state: "WA",
        country: "US",
      }),
    ).toThrow(/not in a MaidLinx service area/i);
  });
});
