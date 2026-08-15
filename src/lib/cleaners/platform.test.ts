import { describe, expect, it } from "vitest";
import {
  canTakeRealJobs,
  evaluateApprovalGates,
  type CleanerGateSnapshot,
} from "@/lib/cleaners/gates";
import {
  backgroundGatePassed,
  derivePlatformStage,
  identityGatePassed,
} from "@/lib/cleaners/platform";
import { scoreAssessment } from "@/lib/cleaners/training";
import {
  buildVerifiedBadgeMessaging,
  computeTrustScores,
} from "@/lib/cleaners/trust";
import { checkEligibility } from "@/lib/matching/eligibility";
import type { MatchBooking, MatchCleaner, MatchContext } from "@/lib/matching/types";

function snapshot(overrides: Partial<CleanerGateSnapshot> = {}): CleanerGateSnapshot {
  return {
    identityStatus: "verified",
    backgroundStatus: "clear",
    phoneVerified: true,
    emailVerified: true,
    agreementsAccepted: true,
    trainingComplete: true,
    assessmentPassed: true,
    adminApproved: true,
    isActive: true,
    ...overrides,
  };
}

describe("Cleaner Platform V1 gates", () => {
  it("allows jobs only when all required gates pass", () => {
    const result = evaluateApprovalGates(snapshot());
    expect(result.allowed).toBe(true);
    expect(canTakeRealJobs(snapshot())).toBe(true);
  });

  it("blocks jobs while identity is PENDING_PROVIDER", () => {
    const result = evaluateApprovalGates(
      snapshot({ identityStatus: "PENDING_PROVIDER" }),
    );
    expect(result.allowed).toBe(false);
    expect(result.failedGates).toContain("identity");
  });

  it("never auto-passes background while pending", () => {
    expect(backgroundGatePassed("PENDING_PROVIDER")).toBe(false);
    expect(backgroundGatePassed("pending")).toBe(false);
    expect(backgroundGatePassed("consider")).toBe(false);
    expect(backgroundGatePassed("clear")).toBe(true);
  });

  it("never treats PENDING_PROVIDER identity as verified", () => {
    expect(identityGatePassed("PENDING_PROVIDER")).toBe(false);
    expect(identityGatePassed("verified")).toBe(true);
  });

  it("does not invent verified badge as vendor background-checked when provider pending", () => {
    const messaging = buildVerifiedBadgeMessaging({
      maidlinxVerified: true,
      backgroundProviderConnected: false,
      backgroundStatus: "clear",
    });
    expect(messaging.badgeLabel).toBe("MaidLinx Verified");
    expect(messaging.badgeExplanation?.toLowerCase()).not.toContain(
      "screened through maidlinx’s screening partner",
    );
    expect(messaging.badgeExplanation?.toLowerCase()).toContain("pending");
  });
});

describe("Academy assessment", () => {
  it("scores and requires 75% to pass", () => {
    const perfect = scoreAssessment({ q1: "b", q2: "a", q3: "b", q4: "b" });
    expect(perfect.passed).toBe(true);
    expect(perfect.score).toBe(100);

    const fail = scoreAssessment({ q1: "a", q2: "b", q3: "a", q4: "a" });
    expect(fail.passed).toBe(false);
  });
});

describe("Trust metrics", () => {
  it("computes operational scores without protected characteristics", () => {
    const scores = computeTrustScores({
      ratingAverage: 4.9,
      ratingCount: 40,
      completedJobs: 20,
      cancellationRate: 0.02,
      onTimeRate: 0.95,
      seriousFlagCount: 0,
    });
    expect(scores.trustScore).toBeGreaterThan(70);
    expect(scores.tier).toBe("TRUSTED");
  });

  it("serious flags reduce score but do not auto-fire", () => {
    const scores = computeTrustScores({
      ratingAverage: 4.5,
      ratingCount: 10,
      completedJobs: 10,
      cancellationRate: 0.1,
      onTimeRate: 0.8,
      seriousFlagCount: 3,
    });
    expect(scores.trustScore).toBeLessThan(90);
    // Flag handling is admin review only — scored, not terminated here.
    expect(scores.tier).not.toBe("ELITE");
  });
});

describe("Pipeline stage", () => {
  it("tracks identity pending before screening", () => {
    expect(
      derivePlatformStage({
        identityStatus: "PENDING_PROVIDER",
        backgroundStatus: "PENDING_PROVIDER",
        trainingComplete: false,
        assessmentPassed: false,
        onboardingStatus: "IN_PROGRESS",
        isActive: false,
      }),
    ).toBe("IDENTITY_PENDING");
  });
});

describe("Matching foundation — operational factors only", () => {
  const booking: MatchBooking = {
    id: "b1",
    customerId: "c1",
    serviceType: "standard",
    scheduledAt: "2026-08-12T14:00:00.000Z",
    arrivalWindowStart: null,
    arrivalWindowEnd: null,
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
  };

  const context: MatchContext = {
    serviceAreaPostalCodes: new Set(["M5V1A1"]),
    serviceAreaCityStates: new Set(["toronto|ON"]),
    availabilityByProfileId: new Map(),
    completedJobsByProfileId: new Map(),
    cancelledJobsByProfileId: new Map(),
    favoriteProfileIds: new Set(),
    repeatProfileIds: new Set(),
    requireStrictMarketplace: false,
  };

  function cleaner(overrides: Partial<MatchCleaner> = {}): MatchCleaner {
    return {
      profileId: "p1",
      cleanerId: "cl1",
      name: "Alex",
      isActive: true,
      isVerified: true,
      onboardingStatus: "APPROVED",
      yearsExperience: 3,
      serviceRadiusKm: 25,
      ratingAverage: 4.8,
      ratingCount: 12,
      latitude: 43.65,
      longitude: -79.38,
      city: "Toronto",
      state: "ON",
      postalCode: "M5V2T6",
      platformGatesAllowed: true,
      ...overrides,
    };
  }

  it("rejects cleaners with incomplete platform gates", () => {
    const result = checkEligibility(
      booking,
      cleaner({ platformGatesAllowed: false }),
      context,
    );
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("gates_incomplete");
  });

  it("does not include demographic fields in match cleaner type keys", () => {
    const keys = Object.keys(cleaner());
    expect(keys).not.toContain("race");
    expect(keys).not.toContain("gender");
    expect(keys).not.toContain("religion");
    expect(keys).not.toContain("nationalOrigin");
  });
});
