import { describe, expect, it } from "vitest";
import {
  evaluateCleanerCoverage,
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
  it("YELLOW when approved but not bookable; GREEN only when launchReady", () => {
    expect(
      marketCoverageStatus({
        configuredActive: true,
        approvedCleaners: 1,
        bookableCleaners: 0,
        launchReady: false,
      }),
    ).toBe("YELLOW");
    expect(
      marketCoverageStatus({
        configuredActive: true,
        approvedCleaners: 1,
        bookableCleaners: 1,
        launchReady: true,
      }),
    ).toBe("GREEN");
  });

  it("overall prefers GREEN then YELLOW then RED", () => {
    expect(
      overallCoverageStatus([
        {
          marketId: "A",
          marketName: "A",
          configuredActive: true,
          approvedCleaners: 0,
          bookableCleaners: 0,
          availableCapacity: 0,
          servicesCovered: 0,
          catalogServices: 9,
          geographicCoverage: "None",
          majorGaps: [],
          launchReady: false,
          status: "RED",
        },
        {
          marketId: "B",
          marketName: "B",
          configuredActive: true,
          approvedCleaners: 1,
          bookableCleaners: 0,
          availableCapacity: 0,
          servicesCovered: 0,
          catalogServices: 9,
          geographicCoverage: "gap",
          majorGaps: [],
          launchReady: false,
          status: "YELLOW",
        },
      ]),
    ).toBe("YELLOW");
  });
});

describe("pickCandidateFirstMarket", () => {
  it("returns null when no approved cleaner and none ready", () => {
    expect(
      pickCandidateFirstMarket({
        hasApprovedActiveCleaner: false,
        markets: [
          { marketId: "TORONTO_GTA", configuredActive: true, launchReady: false },
          { marketId: "SOUTH_FLORIDA", configuredActive: true, launchReady: false },
        ],
      }),
    ).toBeNull();
  });

  it("prefers TORONTO_GTA as ops candidate when approved cleaner exists", () => {
    expect(
      pickCandidateFirstMarket({
        hasApprovedActiveCleaner: true,
        markets: [
          { marketId: "SOUTH_FLORIDA", configuredActive: true, launchReady: false },
          { marketId: "TORONTO_GTA", configuredActive: true, launchReady: false },
        ],
      }),
    ).toBe("TORONTO_GTA");
  });
});
