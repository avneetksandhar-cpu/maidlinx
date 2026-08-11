import { describe, expect, it } from "vitest";
import { rankCleanersForBooking } from "@/lib/matching/rank";
import {
  calculateMatchScore,
  arrivalWindowFromScheduledAt,
} from "@/lib/matching/calculateMatchScore";
import { MATCH_WEIGHTS } from "@/lib/matching/config";
import { haversineKm, resolveDistance } from "@/lib/matching/geo";
import type { MatchBooking, MatchCleaner, MatchContext } from "@/lib/matching/types";

function baseBooking(overrides: Partial<MatchBooking> = {}): MatchBooking {
  return {
    id: "booking-1",
    customerId: "cust-1",
    serviceType: "standard",
    scheduledAt: "2026-08-12T15:00:00.000Z",
    arrivalWindowStart: null,
    arrivalWindowEnd: null,
    notes: null,
    bedrooms: 2,
    bathrooms: 2,
    subtotalCents: 15_000,
    platformFeeCents: 2_250,
    totalCents: 17_250,
    addressCity: "Austin",
    addressState: "TX",
    addressPostalCode: "78701",
    addressLatitude: 30.2672,
    addressLongitude: -97.7431,
    extrasKeys: [],
    ...overrides,
  };
}

function baseCleaner(overrides: Partial<MatchCleaner> = {}): MatchCleaner {
  return {
    profileId: "pro-1",
    cleanerId: "cleaner-1",
    name: "Alex Clean",
    isActive: true,
    isVerified: true,
    yearsExperience: 3,
    serviceRadiusKm: 25,
    ratingAverage: 4.8,
    ratingCount: 20,
    latitude: 30.27,
    longitude: -97.74,
    city: "Austin",
    state: "TX",
    postalCode: "78701",
    ...overrides,
  };
}

function alwaysAvailable(profileId: string) {
  const slots = [];
  for (let day = 0; day < 7; day += 1) {
    for (const window of ["morning", "afternoon", "evening"] as const) {
      slots.push({ dayOfWeek: day, arrivalWindow: window, isAvailable: true });
    }
  }
  return [profileId, slots] as const;
}

function baseContext(overrides: Partial<MatchContext> = {}): MatchContext {
  return {
    serviceAreaPostalCodes: new Set(["78701"]),
    serviceAreaCityStates: new Set(["austin|TX"]),
    availabilityByProfileId: new Map([alwaysAvailable("pro-1")]),
    completedJobsByProfileId: new Map([["pro-1", 18]]),
    cancelledJobsByProfileId: new Map([["pro-1", 2]]),
    favoriteProfileIds: new Set(),
    repeatProfileIds: new Set(),
    ...overrides,
  };
}

describe("geo helpers", () => {
  it("computes haversine distance for nearby points", () => {
    const km = haversineKm(
      { latitude: 30.2672, longitude: -97.7431 },
      { latitude: 30.27, longitude: -97.74 },
    );
    expect(km).toBeGreaterThan(0);
    expect(km).toBeLessThan(1);
  });

  it("falls back to postal when lat/lng missing", () => {
    const resolved = resolveDistance({
      bookingLat: null,
      bookingLng: null,
      cleanerLat: null,
      cleanerLng: null,
      bookingPostal: "78701",
      cleanerPostal: "78701",
      bookingCity: "Austin",
      bookingState: "TX",
      cleanerCity: "Austin",
      cleanerState: "TX",
    });
    expect(resolved.kind).toBe("postal");
  });
});

describe("arrivalWindowFromScheduledAt", () => {
  it("maps hour into morning/afternoon/evening", () => {
    const window = arrivalWindowFromScheduledAt("2026-08-12T15:00:00.000Z");
    expect(["morning", "afternoon", "evening"]).toContain(window);
  });
});

describe("calculateMatchScore", () => {
  it("returns 0–100 with V1 factor breakdown labels", () => {
    const result = calculateMatchScore({
      booking: baseBooking(),
      cleaner: baseCleaner(),
      context: baseContext(),
    });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.factors).toHaveLength(7);
    expect(result.breakdown).toHaveLength(7);
    expect(result.breakdown[0]).toMatch(/Travel Fit \d+\/25/);
    expect(result.factors.map((f) => f.key)).toEqual([
      "travelFit",
      "reliability",
      "customerRating",
      "serviceExperience",
      "scheduleFit",
      "repeatCustomer",
      "operationalFit",
    ]);
    expect(Object.values(MATCH_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("uses neutral rating when rating history is thin", () => {
    const result = calculateMatchScore({
      booking: baseBooking(),
      cleaner: baseCleaner({ ratingAverage: 0, ratingCount: 0 }),
      context: baseContext(),
    });
    const rating = result.factors.find((f) => f.key === "customerRating")!;
    expect(rating.skipped).toBe(true);
    expect(rating.reason).toMatch(/no rating/i);
  });

  it("boosts customer favorites via repeat-customer factor", () => {
    const plain = calculateMatchScore({
      booking: baseBooking(),
      cleaner: baseCleaner(),
      context: baseContext(),
    });
    const favorite = calculateMatchScore({
      booking: baseBooking(),
      cleaner: baseCleaner(),
      context: baseContext({ favoriteProfileIds: new Set(["pro-1"]) }),
    });

    expect(favorite.score).toBeGreaterThan(plain.score);
  });

  it("penalizes cleaners outside their service radius in travel fit", () => {
    const far = calculateMatchScore({
      booking: baseBooking(),
      cleaner: baseCleaner({
        latitude: 32.78,
        longitude: -96.8,
        city: "Dallas",
        state: "TX",
        postalCode: "75201",
        serviceRadiusKm: 20,
      }),
      context: baseContext(),
    });

    const travel = far.factors.find((f) => f.key === "travelFit")!;
    expect(travel.score).toBeLessThan(0.2);
  });

  it("surfaces ETA minutes in travel fit reason (closest ≠ quickest)", () => {
    const result = calculateMatchScore({
      booking: baseBooking(),
      cleaner: baseCleaner(),
      context: baseContext(),
    });
    const travel = result.factors.find((f) => f.key === "travelFit")!;
    expect(travel.reason).toMatch(/min/);
  });

  it("balances workload via operational fit", () => {
    const light = calculateMatchScore({
      booking: baseBooking(),
      cleaner: baseCleaner(),
      context: baseContext({ jobsTodayByProfileId: new Map([["pro-1", 0]]) }),
    });
    const heavy = calculateMatchScore({
      booking: baseBooking(),
      cleaner: baseCleaner(),
      context: baseContext({ jobsTodayByProfileId: new Map([["pro-1", 4]]) }),
    });
    expect(light.score).toBeGreaterThan(heavy.score);
    const ops = heavy.factors.find((f) => f.key === "operationalFit")!;
    expect(ops.reason).toMatch(/jobs today/i);
  });
});

describe("rankCleanersForBooking", () => {
  it("sorts cleaners by score descending", () => {
    const booking = baseBooking();
    const nearby = baseCleaner({
      profileId: "near",
      cleanerId: "c-near",
      name: "Nearby Nora",
      ratingAverage: 4.9,
      ratingCount: 30,
    });
    const far = baseCleaner({
      profileId: "far",
      cleanerId: "c-far",
      name: "Far Fred",
      latitude: 32.78,
      longitude: -96.8,
      city: "Dallas",
      state: "TX",
      postalCode: "75201",
      serviceRadiusKm: 15,
      ratingAverage: 4.0,
      ratingCount: 5,
      isVerified: false,
      yearsExperience: 0,
    });

    const context = baseContext({
      availabilityByProfileId: new Map([alwaysAvailable("near"), alwaysAvailable("far")]),
      completedJobsByProfileId: new Map([
        ["near", 25],
        ["far", 2],
      ]),
      cancelledJobsByProfileId: new Map([
        ["near", 1],
        ["far", 8],
      ]),
      requireVerified: false,
    });

    const ranked = rankCleanersForBooking(booking, [far, nearby], context, {
      limit: 5,
      skipEligibility: true,
    });
    expect(ranked).toHaveLength(2);
    expect(ranked[0]!.profileId).toBe("near");
    expect(ranked[0]!.score).toBeGreaterThan(ranked[1]!.score);
    expect(ranked[0]!.breakdown.length).toBe(7);
  });

  it("excludes inactive cleaners via eligibility", () => {
    const ranked = rankCleanersForBooking(
      baseBooking(),
      [baseCleaner({ isActive: false, profileId: "inactive", cleanerId: "c-off" })],
      baseContext({
        availabilityByProfileId: new Map(),
        completedJobsByProfileId: new Map(),
        cancelledJobsByProfileId: new Map(),
      }),
    );
    expect(ranked).toHaveLength(0);
  });
});
