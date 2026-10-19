import { describe, expect, it } from "vitest";
import {
  buildPropertyHomeRows,
  buildScheduleHrefFromAddress,
  formatCleanDatePill,
} from "@/lib/dashboard/property-home";
import type { SavedAddress } from "@/lib/addresses/types";
import type { DashboardBooking } from "@/lib/dashboard/bookings";

function addr(partial: Partial<SavedAddress> & Pick<SavedAddress, "id" | "addressLine1">): SavedAddress {
  return {
    label: partial.label ?? "Home",
    unit: partial.unit,
    city: partial.city ?? "Miami",
    region: partial.region ?? "FL",
    postalCode: partial.postalCode ?? "33139",
    country: partial.country ?? "US",
    countryCode: partial.countryCode ?? "US",
    isDefault: partial.isDefault ?? true,
    createdAt: partial.createdAt ?? "2026-01-01",
    updatedAt: partial.updatedAt ?? "2026-01-01",
    ...partial,
  };
}

function booking(
  partial: Partial<DashboardBooking> & Pick<DashboardBooking, "id" | "scheduledAt">,
): DashboardBooking {
  return {
    status: "confirmed",
    serviceType: "standard",
    addressLine1: "100 Ocean Dr",
    addressLine2: null,
    addressCity: "Miami",
    addressState: "FL",
    addressPostalCode: "33139",
    addressCountry: "US",
    totalCents: 12000,
    currency: "USD",
    arrivalWindowStart: null,
    arrivalWindowEnd: null,
    professionalProfileId: null,
    professionalName: null,
    invoiceNumber: null,
    stripeReceiptUrl: null,
    stripePaymentIntentId: null,
    createdAt: "2026-01-01T00:00:00Z",
    cancelledAt: null,
    propertyType: "house",
    bedrooms: 2,
    bathrooms: 2,
    squareFootage: 1200,
    extras: [],
    preferredCleanerId: null,
    ...partial,
  };
}

describe("formatCleanDatePill", () => {
  it("returns Today / Tomorrow / weekday pill", () => {
    const now = new Date("2026-04-22T12:00:00");
    expect(formatCleanDatePill("2026-04-22T15:00:00", now)).toBe("Today");
    expect(formatCleanDatePill("2026-04-23T15:00:00", now)).toBe("Tomorrow");
    expect(formatCleanDatePill("2026-04-25T15:00:00", now)).toMatch(/Apr 25/);
  });
});

describe("buildPropertyHomeRows", () => {
  it("attaches next clean from matching upcoming booking", () => {
    const properties = [addr({ id: "a1", addressLine1: "100 Ocean Dr", label: "Beach house" })];
    const upcoming = [
      booking({
        id: "b1",
        scheduledAt: "2026-04-23T12:00:00Z",
        serviceType: "airbnb_turnover",
        addressLine1: "100 Ocean Dr",
      }),
    ];
    const rows = buildPropertyHomeRows(properties, upcoming);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.label).toBe("Beach house");
    expect(rows[0]?.nextClean?.serviceLabel).toMatch(/Airbnb|STR/i);
    expect(rows[0]?.nextClean?.bookingId).toBe("b1");
  });

  it("shows null next clean when no match", () => {
    const properties = [addr({ id: "a1", addressLine1: "100 Ocean Dr" })];
    const rows = buildPropertyHomeRows(properties, []);
    expect(rows[0]?.nextClean).toBeNull();
  });

  it("falls back to booking addresses when no saved places", () => {
    const upcoming = [
      booking({ id: "b1", scheduledAt: "2026-04-23T12:00:00Z", addressLine1: "100 Ocean Dr" }),
      booking({ id: "b2", scheduledAt: "2026-04-24T12:00:00Z", addressLine1: "100 Ocean Dr" }),
    ];
    const rows = buildPropertyHomeRows([], upcoming);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.nextClean?.bookingId).toBe("b1");
  });
});

describe("buildScheduleHrefFromAddress", () => {
  it("prefills property step with address query params", () => {
    const href = buildScheduleHrefFromAddress({
      addressLine1: "100 Ocean Dr",
      city: "Miami",
      region: "FL",
      postalCode: "33139",
      country: "US",
    });
    expect(href).toContain("/book/property?");
    expect(href).toContain("line1=100");
    expect(href).toContain("city=Miami");
  });
});
