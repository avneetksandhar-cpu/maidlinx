import { describe, expect, it } from "vitest";
import {
  checkEligibility,
  filterEligibleCleaners,
  type EligibilityBooking,
  type EligibilityCleaner,
  type EligibilityContext,
} from "@/lib/matching/eligibility";
import { rankCleaners } from "@/lib/matching/rankCleaners";
import type { MatchContext } from "@/lib/matching/types";

function baseContext(overrides: Partial<MatchContext> = {}): EligibilityContext {
  return {
    serviceAreaPostalCodes: new Set(["M5V1A1", "33101"]),
    serviceAreaCityStates: new Set(["toronto|ON", "miami|FL"]),
    availabilityByProfileId: new Map(),
    completedJobsByProfileId: new Map(),
    cancelledJobsByProfileId: new Map(),
    favoriteProfileIds: new Set(),
    repeatProfileIds: new Set(),
    ...overrides,
  };
}

function booking(overrides: Partial<EligibilityBooking> = {}): EligibilityBooking {
  return {
    id: "b1",
    customerId: "c1",
    serviceType: "standard",
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

function cleaner(overrides: Partial<EligibilityCleaner> = {}): EligibilityCleaner {
  return {
    profileId: "p1",
    cleanerId: "cl1",
    name: "Alex Clean",
    isActive: true,
    isVerified: true,
    yearsExperience: 3,
    serviceRadiusKm: 25,
    ratingAverage: 4.8,
    ratingCount: 12,
    latitude: 43.65,
    longitude: -79.38,
    city: "Toronto",
    state: "ON",
    postalCode: "M5V2T6",
    ...overrides,
  };
}

describe("checkEligibility", () => {
  it("marks active verified in-area cleaners eligible", () => {
    const result = checkEligibility(booking(), cleaner(), baseContext());
    expect(result.eligible).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it("rejects inactive cleaners before scoring", () => {
    const result = checkEligibility(booking(), cleaner({ isActive: false }), baseContext());
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("inactive");
  });

  it("rejects offline cleaners when presence is required", () => {
    const result = checkEligibility(
      booking(),
      cleaner({ isOnline: false, onboardingStatus: "APPROVED" }),
      baseContext(),
    );
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("offline");
  });

  it("rejects cleaners with blocked unavailable dates", () => {
    const result = checkEligibility(
      booking({ scheduledAt: "2026-08-12T14:00:00.000Z" }),
      cleaner({
        isOnline: true,
        onboardingStatus: "APPROVED",
        unavailableDates: ["2026-08-12"],
      }),
      baseContext(),
    );
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("unavailable");
  });

  it("rejects unapproved cleaners when required", () => {
    const result = checkEligibility(booking(), cleaner({ isVerified: false }), baseContext());
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("not_approved");
  });

  it("rejects cleaners who cannot reach the job", () => {
    const result = checkEligibility(
      booking(),
      cleaner({
        latitude: 44.5,
        longitude: -79.5,
        serviceRadiusKm: 5,
      }),
      baseContext(),
    );
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("cannot_reach");
  });

  it("rejects cleaners who do not offer the service", () => {
    const result = checkEligibility(
      booking({ serviceType: "office" }),
      cleaner({ offeredServiceTypes: ["standard", "deep"] }),
      baseContext(),
    );
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("service_not_offered");
  });

  it("rejects cleaners outside booking zone when zones are set", () => {
    const result = checkEligibility(
      booking({ zoneId: "zone_toronto_core" }),
      cleaner({ zoneIds: ["zone_gta_west"] }),
      baseContext(),
    );
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("zone_not_covered");
  });

  it("rejects cleaners with schedule conflicts including travel buffer", () => {
    const result = checkEligibility(
      booking({
        scheduledAt: "2026-08-12T15:00:00.000Z",
        durationMinutes: 120,
      }),
      cleaner(),
      baseContext({
        travelBufferMinutes: 30,
        existingJobsByProfileId: new Map([
          [
            "p1",
            [
              {
                bookingId: "other",
                scheduledAt: "2026-08-12T16:30:00.000Z",
                durationMinutes: 90,
              },
            ],
          ],
        ]),
      }),
    );
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("schedule_conflict");
  });

  it("rejects cleaners missing service requirements", () => {
    const result = checkEligibility(
      booking({ requiresVehicle: true, requiredQualifications: ["bonded"] }),
      cleaner({ hasVehicle: false, qualifications: [] }),
      baseContext(),
    );
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("requirements_not_met");
  });
});

describe("filterEligibleCleaners + ranking", () => {
  it("returns no scored cleaners when none are eligible", () => {
    const ranked = rankCleaners(
      booking(),
      [cleaner({ isActive: false }), cleaner({ profileId: "p2", cleanerId: "cl2", isVerified: false })],
      baseContext(),
    );
    expect(ranked).toHaveLength(0);
  });

  it("returns one eligible cleaner", () => {
    const ranked = rankCleaners(booking(), [cleaner()], baseContext());
    expect(ranked).toHaveLength(1);
    expect(ranked[0]!.breakdown.some((b) => b.includes("Travel Fit"))).toBe(true);
  });

  it("ranks multiple eligible cleaners", () => {
    const ranked = rankCleaners(
      booking(),
      [
        cleaner({ profileId: "p_low", cleanerId: "cl_low", name: "Low", ratingAverage: 3.2, ratingCount: 5 }),
        cleaner({ profileId: "p_high", cleanerId: "cl_high", name: "High", ratingAverage: 5, ratingCount: 40 }),
      ],
      baseContext({
        completedJobsByProfileId: new Map([
          ["p_high", 40],
          ["p_low", 2],
        ]),
      }),
    );
    expect(ranked.length).toBe(2);
    expect(ranked[0]!.score).toBeGreaterThanOrEqual(ranked[1]!.score);
  });

  it("never returns ineligible cleaners from filter", () => {
    const filtered = filterEligibleCleaners(
      booking(),
      [cleaner(), cleaner({ profileId: "p2", cleanerId: "cl2", isActive: false })],
      baseContext(),
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.profileId).toBe("p1");
  });
});
