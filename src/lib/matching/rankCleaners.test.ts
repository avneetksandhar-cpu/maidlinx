import { describe, expect, it } from "vitest";
import { rankCleaners } from "@/lib/matching/rankCleaners";
import type { EligibilityBooking, EligibilityCleaner, EligibilityContext } from "@/lib/matching/eligibility";

function context(): EligibilityContext {
  return {
    serviceAreaPostalCodes: new Set(),
    serviceAreaCityStates: new Set(),
    availabilityByProfileId: new Map(),
    completedJobsByProfileId: new Map([
      ["p_high", 40],
      ["p_low", 2],
    ]),
    cancelledJobsByProfileId: new Map(),
    favoriteProfileIds: new Set(),
    repeatProfileIds: new Set(),
  };
}

function booking(): EligibilityBooking {
  return {
    id: "b1",
    customerId: "c1",
    serviceType: "standard",
    scheduledAt: "2026-08-12T10:00:00.000Z",
    arrivalWindowStart: null,
    arrivalWindowEnd: null,
    notes: null,
    bedrooms: 2,
    bathrooms: 1,
    subtotalCents: 15000,
    platformFeeCents: 2250,
    totalCents: 17250,
    addressCity: "Miami",
    addressState: "FL",
    addressPostalCode: "33101",
    addressLatitude: 25.77,
    addressLongitude: -80.19,
    extrasKeys: [],
  };
}

function cleaner(
  profileId: string,
  overrides: Partial<EligibilityCleaner> = {},
): EligibilityCleaner {
  return {
    profileId,
    cleanerId: `cl_${profileId}`,
    name: profileId,
    isActive: true,
    isVerified: true,
    yearsExperience: 3,
    serviceRadiusKm: 40,
    ratingAverage: 4.9,
    ratingCount: 20,
    latitude: 25.78,
    longitude: -80.2,
    city: "Miami",
    state: "FL",
    postalCode: "33101",
    ...overrides,
  };
}

describe("rankCleaners", () => {
  it("excludes ineligible cleaners and never scores them", () => {
    const ranked = rankCleaners(
      booking(),
      [
        cleaner("p_high"),
        cleaner("p_inactive", { isActive: false, ratingAverage: 5, ratingCount: 100 }),
      ],
      context(),
    );
    expect(ranked.map((r) => r.profileId)).toEqual(["p_high"]);
  });

  it("ranks eligible cleaners deterministically by score then name", () => {
    const ranked = rankCleaners(
      booking(),
      [
        cleaner("p_low", { ratingAverage: 3.5, ratingCount: 5 }),
        cleaner("p_high", { ratingAverage: 5, ratingCount: 50 }),
      ],
      context(),
    );
    expect(ranked.length).toBe(2);
    expect(ranked[0]!.score).toBeGreaterThanOrEqual(ranked[1]!.score);
  });
});
