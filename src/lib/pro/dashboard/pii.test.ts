import { describe, expect, it } from "vitest";
import {
  assertJobOwnedByCleaner,
  canRevealExactAddress,
  formatGeneralLocation,
  sanitizeAvailableJob,
} from "@/lib/pro/dashboard/pii";
import type { ProJob } from "@/lib/pro/dashboard/jobs";

function baseJob(overrides: Partial<ProJob> = {}): ProJob {
  return {
    id: "job-1",
    status: "awaiting_assignment",
    serviceType: "standard",
    serviceId: "svc_residential",
    scheduledAt: new Date().toISOString(),
    arrivalWindowStart: null,
    arrivalWindowEnd: null,
    subtotalCents: 15000,
    platformFeeCents: 2250,
    totalCents: 17250,
    currency: "USD",
    bedrooms: 2,
    bathrooms: 1,
    squareFootage: 1200,
    extras: [],
    notes: "Gate code 1234",
    customerFirstName: "Ada",
    customerLastName: "Lovelace",
    customerPhone: "+15551212",
    addressLine1: "123 Secret St",
    addressLine2: "Apt 4",
    addressCity: "Miami",
    addressState: "FL",
    addressPostalCode: "33101",
    addressLatitude: 25.7,
    addressLongitude: -80.2,
    professionalProfileId: null,
    marketId: null,
    zoneId: null,
    jobChecklist: [],
    startedAt: null,
    completedAt: null,
    beforePhotoCount: 0,
    afterPhotoCount: 0,
    estimatedDurationMinutes: 120,
    distanceKm: 4.2,
    travelMinutes: 12,
    addressRevealed: false,
    ...overrides,
  };
}

describe("sanitizeAvailableJob", () => {
  it("strips street, customer contact, notes, and coordinates", () => {
    const sanitized = sanitizeAvailableJob(baseJob());
    expect(sanitized.addressLine1).toBeNull();
    expect(sanitized.addressLine2).toBeNull();
    expect(sanitized.addressLatitude).toBeNull();
    expect(sanitized.addressLongitude).toBeNull();
    expect(sanitized.customerFirstName).toBeNull();
    expect(sanitized.customerLastName).toBeNull();
    expect(sanitized.customerPhone).toBeNull();
    expect(sanitized.notes).toBeNull();
    expect(sanitized.addressCity).toBe("Miami");
    expect(sanitized.addressState).toBe("FL");
    expect(sanitized.addressPostalCode).toBe("33101");
    expect(sanitized.addressRevealed).toBe(false);
  });
});

describe("canRevealExactAddress", () => {
  it("never reveals for unassigned marketplace jobs", () => {
    expect(canRevealExactAddress(baseJob(), "cleaner-a")).toBe(false);
  });

  it("never reveals another cleaner's assigned job", () => {
    expect(
      canRevealExactAddress(
        baseJob({ status: "assigned", professionalProfileId: "cleaner-b" }),
        "cleaner-a",
      ),
    ).toBe(false);
  });

  it("reveals for the assigned cleaner on active statuses", () => {
    expect(
      canRevealExactAddress(
        baseJob({ status: "assigned", professionalProfileId: "cleaner-a" }),
        "cleaner-a",
      ),
    ).toBe(true);
    expect(
      canRevealExactAddress(
        baseJob({ status: "in_progress", professionalProfileId: "cleaner-a" }),
        "cleaner-a",
      ),
    ).toBe(true);
  });
});

describe("assertJobOwnedByCleaner", () => {
  it("throws when another cleaner tries to access a private job", () => {
    expect(() =>
      assertJobOwnedByCleaner(
        { professionalProfileId: "cleaner-b" },
        "cleaner-a",
      ),
    ).toThrow("You do not have access to this job.");
  });

  it("allows the owning cleaner", () => {
    expect(() =>
      assertJobOwnedByCleaner(
        { professionalProfileId: "cleaner-a" },
        "cleaner-a",
      ),
    ).not.toThrow();
  });
});

describe("formatGeneralLocation", () => {
  it("formats city-level location without street", () => {
    expect(formatGeneralLocation("Miami", "FL", "33101")).toBe("Miami, FL · 33101");
  });
});
