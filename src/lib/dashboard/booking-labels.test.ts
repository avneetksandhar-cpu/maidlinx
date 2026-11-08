import { describe, expect, it } from "vitest";
import {
  bookingStatusPillLabel,
  buildRebookHref,
  formatFullAddress,
  isRecurringBooking,
  laterSectionTitle,
  resolvePropertyLabel,
} from "@/lib/dashboard/booking-labels";
import type { DashboardBooking } from "@/lib/dashboard/bookings";
import type { SavedAddress } from "@/lib/addresses/types";

function booking(partial: Partial<DashboardBooking> = {}): DashboardBooking {
  return {
    id: "b1",
    status: "accepted",
    serviceType: "office",
    scheduledAt: "2026-11-06T14:00:00.000Z",
    arrivalWindowStart: null,
    arrivalWindowEnd: null,
    totalCents: 14500,
    currency: "USD",
    addressLine1: "120 Ocean Blvd",
    addressLine2: null,
    addressCity: "Boca Raton",
    addressState: "FL",
    addressPostalCode: "33432",
    addressCountry: "US",
    addressLatitude: 26.35,
    addressLongitude: -80.08,
    addressId: "site-1",
    notes: null,
    recurringPreference: "weekly",
    professionalProfileId: null,
    professionalName: null,
    invoiceNumber: null,
    stripeReceiptUrl: null,
    stripePaymentIntentId: null,
    createdAt: "2026-11-01T00:00:00.000Z",
    cancelledAt: null,
    bedrooms: null,
    bathrooms: null,
    squareFootage: null,
    extras: [],
    propertyType: "business",
    preferredCleanerId: null,
    ...partial,
  };
}

describe("booking-labels", () => {
  it("prefers saved-place labels over street address", () => {
    const sites: SavedAddress[] = [
      {
        id: "site-1",
        label: "Boca office",
        addressLine1: "120 Ocean Blvd",
        city: "Boca Raton",
        region: "FL",
        postalCode: "33432",
        country: "US",
        countryCode: "US",
        isDefault: true,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ];
    expect(resolvePropertyLabel(booking(), sites)).toBe("Boca office");
  });

  it("uses real status pill labels — awaiting assignment when unassigned", () => {
    expect(bookingStatusPillLabel("accepted")).toBe("Confirmed");
    expect(bookingStatusPillLabel("awaiting_assignment")).toBe("Awaiting assignment");
    expect(bookingStatusPillLabel("completed")).toBe("Completed");
  });

  it("formats address and recurring flag", () => {
    expect(formatFullAddress(booking())).toContain("120 Ocean Blvd");
    expect(isRecurringBooking(booking())).toBe(true);
    expect(isRecurringBooking(booking({ recurringPreference: "one_time" }))).toBe(false);
  });

  it("builds rebook href with property + service prefill", () => {
    const href = buildRebookHref(booking());
    expect(href.startsWith("/book/date?")).toBe(true);
    expect(href).toContain("serviceType=office");
    expect(href).toContain("line1=120");
  });

  it("titles later section by month", () => {
    const now = new Date("2026-11-08T12:00:00Z");
    expect(laterSectionTitle("2026-11-13T12:00:00Z", now)).toBe("Later this month");
    expect(laterSectionTitle("2026-12-13T12:00:00Z", now)).toBe("Later");
  });
});
