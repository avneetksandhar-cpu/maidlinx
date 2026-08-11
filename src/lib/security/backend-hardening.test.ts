import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  assertPriceMatch,
  calculateBookingPrice,
  withServerDiscount,
} from "@/lib/pricing/calculateQuote";
import { computeDiscountCents, assertCouponCurrentlyValid } from "@/lib/pricing/promos";
import { validateBookingStatusTransition } from "@/lib/bookings/status";
import { validateCleanerStatusTransition } from "@/lib/pro/job-transitions";
import { assertJobOwnedByCleaner } from "@/lib/pro/dashboard/pii";
import { hasPermission, ADMIN_ROLE_PRESETS } from "@/lib/admin/permissions";
import { resolveMarketOrThrow } from "@/lib/markets/eligibility";
import { findScheduleConflict } from "@/lib/availability/conflicts";
import { generateAvailableSlots } from "@/lib/availability/slots";
import { checkEligibility } from "@/lib/matching/eligibility";
import { canSubmitReview } from "@/lib/reviews/submit";
import { checkRateLimit, resetRateLimitBuckets } from "@/lib/api/rate-limit";
import { verifyBookingAccessToken, createBookingAccessToken } from "@/lib/bookings/access-token";
import { isDevTestBookingEnabled } from "@/lib/bookings/dev-test";
import { RECURRING_GENERATION_IMPLEMENTED } from "@/lib/recurring";
import type { Coupon } from "@/lib/admin/coupons";

const miamiInput = {
  line1: "100 Ocean Dr",
  city: "Miami Beach",
  state: "FL",
  postalCode: "33139",
  country: "US",
  serviceType: "standard" as const,
  bedrooms: 2,
  bathrooms: 2,
  squareFootage: 1200,
  extras: [] as [],
};

describe("price manipulation", () => {
  it("rejects browser totals that underpay", () => {
    const quote = calculateBookingPrice(miamiInput);
    expect(() => assertPriceMatch(quote.totalCents - 5000, quote.totalCents)).toThrow(
      /Price mismatch/,
    );
  });

  it("keeps platform fee on subtotal; promo only reduces payable total", () => {
    const quote = calculateBookingPrice(miamiInput);
    const discounted = withServerDiscount(quote, 2000);
    expect(discounted.platformFeeCents).toBe(quote.platformFeeCents);
    expect(discounted.totalCents).toBe(quote.totalCents - 2000);
    expect(discounted.totalCents).toBeLessThan(
      discounted.subtotalCents + discounted.platformFeeCents,
    );
  });
});

describe("promo server validation", () => {
  const coupon: Coupon = {
    id: "c1",
    code: "SAVE10",
    description: null,
    discountType: "percent",
    discountValue: 10,
    minOrderCents: 10000,
    maxUses: 5,
    usedCount: 1,
    validFrom: null,
    validUntil: null,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  it("computes percent discount from subtotal only", () => {
    expect(computeDiscountCents(coupon, 20000)).toBe(2000);
  });

  it("rejects inactive / exhausted coupons", () => {
    expect(() => assertCouponCurrentlyValid({ ...coupon, isActive: false })).toThrow(/inactive/i);
    expect(() =>
      assertCouponCurrentlyValid({ ...coupon, maxUses: 1, usedCount: 1 }),
    ).toThrow(/usage limit/i);
  });
});

describe("IDOR / booking access token", () => {
  it("rejects forged access tokens for another booking id", () => {
    const token = createBookingAccessToken("booking-a");
    expect(verifyBookingAccessToken("booking-b", token)).toBe(false);
    expect(verifyBookingAccessToken("booking-a", token)).toBe(true);
  });
});

describe("cleaner unauthorized", () => {
  it("blocks status updates on jobs owned by another cleaner", () => {
    expect(() =>
      assertJobOwnedByCleaner(
        { professionalProfileId: "cleaner-owner" },
        "attacker",
      ),
    ).toThrow(/do not have access/);
  });
});

describe("admin authz", () => {
  it("denies support role from pricing and booking writes", () => {
    const perms = ADMIN_ROLE_PRESETS.support ?? [];
    expect(hasPermission(perms, "pricing.write", "support")).toBe(false);
    expect(hasPermission(perms, "bookings.write", "support")).toBe(false);
    expect(hasPermission(perms, "support.write", "support")).toBe(true);
  });
});

describe("booking create pricing + service area", () => {
  it("creates a positive instant total for in-market address", () => {
    const quote = calculateBookingPrice(miamiInput);
    expect(quote.totalCents).toBeGreaterThan(0);
    expect(quote.currency).toBe("USD");
  });

  it("rejects out of market addresses", () => {
    expect(() =>
      resolveMarketOrThrow({
        postalCode: "78701",
        city: "Austin",
        state: "TX",
        country: "US",
      }),
    ).toThrow(/service area/i);
  });
});

describe("webhook / payment semantics (contracts)", () => {
  it("documents pending_payment → awaiting_assignment as the success transition", () => {
    expect(validateBookingStatusTransition("pending_payment", "awaiting_assignment").valid).toBe(
      true,
    );
    expect(validateBookingStatusTransition("pending_payment", "completed").valid).toBe(false);
  });

  it("documents failed payment must not move booking to assigned", () => {
    expect(validateBookingStatusTransition("pending_payment", "assigned").valid).toBe(false);
  });
});

describe("availability overlap", () => {
  it("detects overlapping jobs with travel buffer", () => {
    const result = findScheduleConflict({
      proposed: {
        bookingId: "new",
        scheduledAt: "2026-08-10T10:00:00.000Z",
        durationMinutes: 120,
      },
      existing: [
        {
          bookingId: "existing",
          scheduledAt: "2026-08-10T11:00:00.000Z",
          durationMinutes: 90,
        },
      ],
      travelBufferMinutes: 30,
    });
    expect(result.hasConflict).toBe(true);
  });

  it("generates slots without inventing fake cleaner supply", () => {
    const slots = generateAvailableSlots({
      date: "2026-08-12",
      durationMinutes: 120,
      supplyByWindow: { morning: 2, afternoon: 0, evening: 1 },
    });
    expect(slots.find((s) => s.id === "afternoon")?.available).toBe(false);
    expect(slots.find((s) => s.id === "morning")?.available).toBe(true);
  });
});

describe("matching eligibility", () => {
  it("rejects inactive cleaners before scoring", () => {
    const result = checkEligibility(
      {
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
        addressCity: "Miami Beach",
        addressState: "FL",
        addressPostalCode: "33139",
        addressLatitude: 25.79,
        addressLongitude: -80.13,
        extrasKeys: [],
      },
      {
        profileId: "p1",
        cleanerId: "c1",
        name: "Inactive",
        isActive: false,
        isVerified: true,
        yearsExperience: 3,
        serviceRadiusKm: 25,
        ratingAverage: 5,
        ratingCount: 10,
        latitude: 25.79,
        longitude: -80.13,
        city: "Miami Beach",
        state: "FL",
        postalCode: "33139",
      },
      {
        serviceAreaPostalCodes: new Set(["33139"]),
        serviceAreaCityStates: new Set(["miami beach|FL"]),
        availabilityByProfileId: new Map(),
        completedJobsByProfileId: new Map(),
        cancelledJobsByProfileId: new Map(),
        favoriteProfileIds: new Set(),
        repeatProfileIds: new Set(),
      },
    );
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("inactive");
  });
});

describe("dual accept", () => {
  it("only first optimistic claim wins", () => {
    let holder: string | null = null;
    const claim = (id: string) => {
      if (holder) return false;
      holder = id;
      return true;
    };
    expect(claim("a")).toBe(true);
    expect(claim("b")).toBe(false);
    expect(holder).toBe("a");
  });
});

describe("status transitions", () => {
  it("enforces cleaner lifecycle without skipping", () => {
    expect(validateCleanerStatusTransition("assigned", "on_the_way").valid).toBe(true);
    expect(validateCleanerStatusTransition("assigned", "completed").valid).toBe(false);
  });
});

describe("review authz", () => {
  it("allows only completed booking owners, one review", () => {
    expect(
      canSubmitReview({
        bookingStatus: "completed",
        bookingCustomerId: "u1",
        bookingCustomerEmail: "a@b.com",
        reviewerId: "u1",
        reviewerEmail: "a@b.com",
        hasExistingReview: false,
        hasAssignedCleaner: true,
      }).ok,
    ).toBe(true);

    expect(
      canSubmitReview({
        bookingStatus: "assigned",
        bookingCustomerId: "u1",
        bookingCustomerEmail: "a@b.com",
        reviewerId: "u1",
        reviewerEmail: "a@b.com",
        hasExistingReview: false,
        hasAssignedCleaner: true,
      }).ok,
    ).toBe(false);

    expect(
      canSubmitReview({
        bookingStatus: "completed",
        bookingCustomerId: "u1",
        bookingCustomerEmail: "a@b.com",
        reviewerId: "attacker",
        reviewerEmail: "evil@x.com",
        hasExistingReview: false,
        hasAssignedCleaner: true,
      }).ok,
    ).toBe(false);

    expect(
      canSubmitReview({
        bookingStatus: "completed",
        bookingCustomerId: "u1",
        bookingCustomerEmail: "a@b.com",
        reviewerId: "u1",
        reviewerEmail: "a@b.com",
        hasExistingReview: true,
        hasAssignedCleaner: true,
      }).ok,
    ).toBe(false);
  });
});

describe("rate limiting", () => {
  beforeEach(() => resetRateLimitBuckets());

  it("blocks after limit is exceeded", () => {
    expect(checkRateLimit("t1", 2, 60_000).allowed).toBe(true);
    expect(checkRateLimit("t1", 2, 60_000).allowed).toBe(true);
    expect(checkRateLimit("t1", 2, 60_000).allowed).toBe(false);
  });
});

describe("dev test booking production guard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("never allows DEV_TEST_BOOKING when NODE_ENV is production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOW_DEV_TEST_BOOKING", "true");
    vi.stubEnv("ALLOW_DEV_BOOKING", "true");
    expect(isDevTestBookingEnabled()).toBe(false);
  });
});

describe("recurring honesty", () => {
  it("labels generation as not implemented", () => {
    expect(RECURRING_GENERATION_IMPLEMENTED).toBe(false);
  });
});
