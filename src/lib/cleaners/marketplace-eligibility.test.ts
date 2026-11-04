import { describe, expect, it } from "vitest";
import { checkMarketplaceCleanerEligibility } from "@/lib/cleaners/marketplace-eligibility";
import type { MatchBooking, MatchCleaner, MatchContext } from "@/lib/matching/types";

function booking(overrides: Partial<MatchBooking> = {}): MatchBooking {
  return {
    id: "b1",
    customerId: "c1",
    serviceType: "standard",
    serviceId: "svc_residential",
    marketId: "TORONTO_GTA",
    zoneId: "zone_toronto_core",
    scheduledAt: "2026-08-12T14:00:00.000Z",
    arrivalWindowStart: null,
    arrivalWindowEnd: null,
    durationMinutes: 120,
    notes: null,
    bedrooms: 2,
    bathrooms: 1,
    subtotalCents: 15000,
    platformFeeCents: 2250,
    totalCents: 17250,
    addressCity: "Toronto",
    addressState: "ON",
    addressPostalCode: "M5V1A1",
    addressLatitude: 43.64,
    addressLongitude: -79.39,
    extrasKeys: [],
    ...overrides,
  };
}

function cleaner(overrides: Partial<MatchCleaner> = {}): MatchCleaner {
  return {
    profileId: "p1",
    cleanerId: "cl1",
    name: "Alex Clean",
    isActive: true,
    isVerified: true,
    approved: true,
    onboardingStatus: "APPROVED",
    isOnline: true,
    marketId: "TORONTO_GTA",
    yearsExperience: 3,
    serviceRadiusKm: 25,
    ratingAverage: 4.8,
    ratingCount: 12,
    latitude: 43.65,
    longitude: -79.38,
    city: "Toronto",
    state: "ON",
    postalCode: "M5V2T6",
    offeredServiceTypes: ["standard", "svc_residential"],
    zoneIds: ["zone_toronto_core"],
    ...overrides,
  };
}

function context(overrides: Partial<MatchContext> = {}): MatchContext {
  return {
    serviceAreaPostalCodes: new Set(["M5V1A1"]),
    serviceAreaCityStates: new Set(["toronto|ON"]),
    availabilityByProfileId: new Map([
      [
        "p1",
        [{ dayOfWeek: new Date("2026-08-12T14:00:00.000Z").getDay(), arrivalWindow: "afternoon", isAvailable: true }],
      ],
    ]),
    completedJobsByProfileId: new Map(),
    cancelledJobsByProfileId: new Map(),
    favoriteProfileIds: new Set(),
    repeatProfileIds: new Set(),
    ...overrides,
  };
}

describe("checkMarketplaceCleanerEligibility", () => {
  it("passes when all hard gates met", () => {
    const result = checkMarketplaceCleanerEligibility({
      booking: booking(),
      cleaner: cleaner(),
      context: context(),
    });
    expect(result.eligible).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it("fails without services / zones / availability (no soft open)", () => {
    const result = checkMarketplaceCleanerEligibility({
      booking: booking(),
      cleaner: cleaner({ offeredServiceTypes: [], zoneIds: [] }),
      context: context({ availabilityByProfileId: new Map() }),
    });
    expect(result.eligible).toBe(false);
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "service_not_offered",
        "zone_not_covered",
        "missing_availability",
      ]),
    );
  });

  it("fails when cleaner market does not match booking market", () => {
    const result = checkMarketplaceCleanerEligibility({
      booking: booking({ marketId: "SOUTH_FLORIDA", zoneId: "zone_miami_dade" }),
      cleaner: cleaner({
        marketId: "TORONTO_GTA",
        zoneIds: ["zone_toronto_core"],
      }),
      context: context(),
    });
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("market_not_eligible");
  });

  it("allows Florida cleaner for Florida booking via zones", () => {
    const day = new Date("2026-08-12T18:00:00.000Z").getDay();
    const result = checkMarketplaceCleanerEligibility({
      booking: booking({
        marketId: "SOUTH_FLORIDA",
        zoneId: "zone_miami_dade",
        addressCity: "Miami",
        addressState: "FL",
        addressPostalCode: "33139",
        scheduledAt: "2026-08-12T18:00:00.000Z",
      }),
      cleaner: cleaner({
        marketId: null,
        zoneIds: ["zone_miami_dade"],
        city: "Miami",
        state: "FL",
        postalCode: "33139",
      }),
      context: context({
        availabilityByProfileId: new Map([
          ["p1", [{ dayOfWeek: day, arrivalWindow: "afternoon", isAvailable: true }]],
        ]),
      }),
    });
    expect(result.eligible).toBe(true);
  });
});
