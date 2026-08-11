import { describe, expect, it } from "vitest";
import { validateCleanerStatusTransition, ACTION_TO_STATUS } from "@/lib/pro/job-transitions";
import { getChecklistForService } from "@/lib/pro/dashboard/checklist";
import { sanitizeAvailableJob, assertJobOwnedByCleaner } from "@/lib/pro/dashboard/pii";
import type { ProJob } from "@/lib/pro/dashboard/jobs";

/**
 * Authorization & security-focused unit coverage for cleaner job access.
 * Repository functions that hit Supabase are covered via ownership helpers here;
 * transition skipping is covered in job-transitions.test.ts.
 */

function assignedJob(ownerId: string): Pick<ProJob, "professionalProfileId" | "status"> {
  return { professionalProfileId: ownerId, status: "assigned" };
}

describe("cleaner job authorization", () => {
  it("denies access when professional_profile_id belongs to another cleaner", () => {
    expect(() => assertJobOwnedByCleaner(assignedJob("owner-1"), "attacker-2")).toThrow(
      /do not have access/,
    );
  });

  it("allows only the assigned cleaner", () => {
    expect(() => assertJobOwnedByCleaner(assignedJob("owner-1"), "owner-1")).not.toThrow();
  });

  it("keeps marketplace listings free of street-level PII", () => {
    const listing = sanitizeAvailableJob({
      id: "x",
      status: "awaiting_assignment",
      serviceType: "deep",
      serviceId: null,
      scheduledAt: new Date().toISOString(),
      arrivalWindowStart: null,
      arrivalWindowEnd: null,
      subtotalCents: 20000,
      platformFeeCents: 3000,
      totalCents: 23000,
      currency: "USD",
      bedrooms: 3,
      bathrooms: 2,
      squareFootage: 1800,
      extras: [],
      notes: "hidden",
      customerFirstName: "Pat",
      customerLastName: "Lee",
      customerPhone: "+10001112222",
      addressLine1: "9 Hidden Ave",
      addressLine2: null,
      addressCity: "Toronto",
      addressState: "ON",
      addressPostalCode: "M5V1A1",
      addressLatitude: 43.6,
      addressLongitude: -79.3,
      professionalProfileId: null,
      marketId: null,
      zoneId: null,
      jobChecklist: [],
      startedAt: null,
      completedAt: null,
      beforePhotoCount: 0,
      afterPhotoCount: 0,
      estimatedDurationMinutes: 180,
      distanceKm: null,
      travelMinutes: null,
      addressRevealed: false,
    });

    expect(listing.addressLine1).toBeNull();
    expect(listing.customerPhone).toBeNull();
    expect(listing.notes).toBeNull();
  });
});

describe("cleaner status transitions (no skipping)", () => {
  it("maps UI actions to DB statuses", () => {
    expect(ACTION_TO_STATUS.accept).toBe("accepted");
    expect(ACTION_TO_STATUS.onTheWay).toBe("on_the_way");
    expect(ACTION_TO_STATUS.arrived).toBe("arrived");
    expect(ACTION_TO_STATUS.start).toBe("in_progress");
    expect(ACTION_TO_STATUS.complete).toBe("completed");
  });

  it("rejects skip from accepted to in_progress", () => {
    expect(validateCleanerStatusTransition("accepted", "in_progress").valid).toBe(false);
  });

  it("rejects mutating another cleaner job conceptually via ownership check before transition", () => {
    // transitionJobStatus enforces professional_profile_id === profileId server-side.
    expect(() => assertJobOwnedByCleaner(assignedJob("cleaner-a"), "cleaner-b")).toThrow();
  });
});

describe("service-specific checklists", () => {
  it("returns distinct checklist items for airbnb vs office", () => {
    const airbnb = getChecklistForService("airbnb_turnover");
    const office = getChecklistForService("office");
    expect(airbnb.some((i) => i.id === "linen")).toBe(true);
    expect(office.some((i) => i.id === "desks")).toBe(true);
    expect(airbnb.find((i) => i.id === "linen")).not.toEqual(
      office.find((i) => i.id === "desks"),
    );
  });
});
