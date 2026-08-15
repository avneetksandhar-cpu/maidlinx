import { describe, expect, it } from "vitest";
import {
  evaluateCleanerCoverage,
  evaluateMarketCoverageReady,
  marketCoverageStatus,
  overallCoverageStatus,
  pickCandidateFirstMarket,
} from "@/lib/owner/launch-coverage";

describe("evaluateCleanerCoverage", () => {
  it("marks incomplete approved cleaner as not bookable with honest missing list", () => {
    const row = evaluateCleanerCoverage({
      cleanerId: "c1",
      approved: true,
      active: true,
      onboardingStatus: "APPROVED",
      isOnline: false,
      marketId: null,
      zoneCount: 0,
      serviceCount: 0,
      availabilityCount: 0,
    });
    expect(row.bookable).toBe(false);
    expect(row.eligibleToReceiveJobs).toBe(false);
    expect(row.missing).toEqual(
      expect.arrayContaining([
        "market_or_service_area",
        "services",
        "availability",
        "online_for_offers",
      ]),
    );
  });

  it("requires zones/services/availability for bookable", () => {
    const row = evaluateCleanerCoverage({
      cleanerId: "c2",
      approved: true,
      active: true,
      onboardingStatus: "APPROVED",
      isOnline: true,
      marketId: "TORONTO_GTA",
      zoneCount: 1,
      serviceCount: 2,
      availabilityCount: 5,
    });
    expect(row.bookable).toBe(true);
    expect(row.eligibleToReceiveJobs).toBe(true);
    expect(row.missing).toEqual([]);
  });
});

describe("market / overall status", () => {
  it("never GREEN for one bookable cleaner without redundancy + flags", () => {
    expect(
      marketCoverageStatus({
        configuredActive: true,
        approvedCleaners: 1,
        bookableCleaners: 1,
        coverageReady: false,
        launchReady: false,
      }),
    ).toBe("YELLOW");
    expect(
      marketCoverageStatus({
        configuredActive: true,
        approvedCleaners: 2,
        bookableCleaners: 2,
        coverageReady: true,
        launchReady: true,
      }),
    ).toBe("GREEN");
  });

  it("coverageReady requires ≥2 bookable cleaners", () => {
    expect(
      evaluateMarketCoverageReady({
        configuredActive: true,
        bookableCleaners: 1,
        availableCapacity: 1,
        catalogServices: 9,
        zonesWithCleaners: 1,
        pricingReady: true,
      }),
    ).toBe(false);
    expect(
      evaluateMarketCoverageReady({
        configuredActive: true,
        bookableCleaners: 2,
        availableCapacity: 1,
        catalogServices: 9,
        zonesWithCleaners: 1,
        pricingReady: true,
      }),
    ).toBe(true);
  });

  it("overall prefers GREEN then YELLOW then RED (informational only)", () => {
    expect(
      overallCoverageStatus([
        {
          marketId: "A",
          marketName: "A",
          configuredActive: true,
          bookingEnabled: false,
          launchEnabled: false,
          approvedCleaners: 0,
          bookableCleaners: 0,
          availableToday: 0,
          availableCapacity: 0,
          servicesCovered: 0,
          catalogServices: 9,
          zonesConfigured: 3,
          zonesWithCleaners: 0,
          geographicCoverage: "None",
          majorGaps: [],
          pricingReady: false,
          currencyReady: true,
          currency: "CAD",
          coverageReady: false,
          launchReady: false,
          status: "RED",
        },
        {
          marketId: "B",
          marketName: "B",
          configuredActive: true,
          bookingEnabled: false,
          launchEnabled: false,
          approvedCleaners: 1,
          bookableCleaners: 0,
          availableToday: 0,
          availableCapacity: 0,
          servicesCovered: 0,
          catalogServices: 9,
          zonesConfigured: 3,
          zonesWithCleaners: 0,
          geographicCoverage: "gap",
          majorGaps: [],
          pricingReady: false,
          currencyReady: true,
          currency: "USD",
          coverageReady: false,
          launchReady: false,
          status: "YELLOW",
        },
      ]),
    ).toBe("YELLOW");
  });
});

describe("pickCandidateFirstMarket", () => {
  it("returns null when no attributed cleaners", () => {
    expect(
      pickCandidateFirstMarket({
        markets: [
          {
            marketId: "TORONTO_GTA",
            configuredActive: true,
            launchReady: false,
            coverageReady: false,
            approvedCleaners: 0,
            bookableCleaners: 0,
          },
          {
            marketId: "SOUTH_FLORIDA",
            configuredActive: true,
            launchReady: false,
            coverageReady: false,
            approvedCleaners: 0,
            bookableCleaners: 0,
          },
        ],
      }),
    ).toBeNull();
  });

  it("does not prefer TORONTO_GTA when only Florida has attributed cleaners", () => {
    expect(
      pickCandidateFirstMarket({
        markets: [
          {
            marketId: "TORONTO_GTA",
            configuredActive: true,
            launchReady: false,
            coverageReady: false,
            approvedCleaners: 0,
            bookableCleaners: 0,
          },
          {
            marketId: "SOUTH_FLORIDA",
            configuredActive: true,
            launchReady: false,
            coverageReady: false,
            approvedCleaners: 1,
            bookableCleaners: 0,
          },
        ],
      }),
    ).toBe("SOUTH_FLORIDA");
  });
});
