import { describe, expect, it } from "vitest";
import { DEFAULT_BOOKING_STATE, type BookingState } from "@/lib/bookings/booking-state";
import type { DashboardBooking } from "@/lib/dashboard/bookings";
import {
  finishBookingHref,
  hasMidBookingDraft,
  isCleanerOnTheWay,
  resolveHomeResumeCta,
} from "@/lib/home/resume-cta";

function draft(overrides: Partial<BookingState> = {}): BookingState {
  return { ...DEFAULT_BOOKING_STATE, ...overrides };
}

function booking(overrides: Partial<DashboardBooking> = {}): DashboardBooking {
  return {
    id: "bk_1",
    status: "confirmed",
    serviceType: "standard",
    scheduledAt: "2026-11-05T15:00:00.000Z",
    arrivalWindowStart: null,
    arrivalWindowEnd: null,
    totalCents: 12000,
    currency: "USD",
    addressLine1: "1 Ocean Dr",
    addressLine2: null,
    addressCity: "Miami",
    addressState: "FL",
    addressPostalCode: "33139",
    addressCountry: "US",
    addressLatitude: null,
    addressLongitude: null,
    addressId: null,
    notes: null,
    recurringPreference: null,
    professionalProfileId: null,
    professionalName: null,
    invoiceNumber: null,
    stripeReceiptUrl: null,
    stripePaymentIntentId: null,
    createdAt: "2026-11-04T12:00:00.000Z",
    cancelledAt: null,
    bedrooms: 2,
    bathrooms: 1,
    squareFootage: 1200,
    extras: [],
    propertyType: "house",
    preferredCleanerId: null,
    ...overrides,
  };
}

describe("resolveHomeResumeCta priority", () => {
  it("prefers on the way over everything", () => {
    const cta = resolveHomeResumeCta({
      upcoming: booking({ status: "on_the_way" }),
      draft: draft({ line1: "9 Mid St", serviceType: "standard" }),
      hasUsualClean: true,
    });
    expect(cta?.kind).toBe("on_the_way");
    expect(cta?.cta).toBe("View arrival");
  });

  it("prefers upcoming over finish booking and usual", () => {
    const cta = resolveHomeResumeCta({
      upcoming: booking({ status: "assigned" }),
      draft: draft({ line1: "9 Mid St", serviceType: "standard" }),
      hasUsualClean: true,
    });
    expect(cta?.kind).toBe("upcoming");
    expect(cta?.cta).toBe("View my clean");
  });

  it("prefers finish booking over usual when mid-draft", () => {
    const cta = resolveHomeResumeCta({
      upcoming: null,
      draft: draft({
        line1: "9 Mid St",
        city: "Miami",
        state: "FL",
        postalCode: "33130",
        country: "US",
        marketId: "SOUTH_FLORIDA",
        inServiceArea: true,
        serviceType: "standard",
      }),
      hasUsualClean: true,
    });
    expect(cta?.kind).toBe("finish_booking");
    expect(cta?.cta).toBe("Continue booking");
    expect(cta?.label).toBe("Finish your booking");
    expect(cta?.href).toContain("finish=1");
  });

  it("falls back to usual when no live booking or draft", () => {
    const cta = resolveHomeResumeCta({
      upcoming: null,
      draft: draft(),
      hasUsualClean: true,
    });
    expect(cta?.kind).toBe("usual");
    expect(cta?.cta).toBe("Choose a new time");
  });

  it("returns null when nothing to resume", () => {
    expect(
      resolveHomeResumeCta({
        upcoming: null,
        draft: draft(),
        hasUsualClean: false,
      }),
    ).toBeNull();
  });
});

describe("hasMidBookingDraft", () => {
  it("detects abandoned service selection", () => {
    expect(hasMidBookingDraft(draft({ serviceType: "deep" }))).toBe(true);
  });

  it("ignores empty draft", () => {
    expect(hasMidBookingDraft(draft())).toBe(false);
  });
});

describe("finishBookingHref", () => {
  it("opens furthest unfinished step with finish flag", () => {
    const href = finishBookingHref(
      draft({
        line1: "1 Ocean",
        city: "Miami",
        state: "FL",
        postalCode: "33139",
        country: "US",
        marketId: "SOUTH_FLORIDA",
        inServiceArea: true,
        propertyType: "house",
        bedrooms: 2,
        bathrooms: 1,
        squareFootage: 1200,
        serviceType: "standard",
        serviceTierId: "standard",
        extras: [],
      }),
    );
    expect(href).toContain("/book/date");
    expect(href).toContain("finish=1");
  });
});

describe("isCleanerOnTheWay", () => {
  it("includes arrived and in progress", () => {
    expect(isCleanerOnTheWay("arrived")).toBe(true);
    expect(isCleanerOnTheWay("in_progress")).toBe(true);
    expect(isCleanerOnTheWay("confirmed")).toBe(false);
  });
});
