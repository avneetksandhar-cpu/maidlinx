import { describe, expect, it } from "vitest";
import { resolveJobDurationMinutes } from "@/lib/availability/duration";
import { suggestArrivalWindows } from "@/lib/availability/windows";
import { checkCleanerAvailability } from "@/lib/availability";

describe("resolveJobDurationMinutes", () => {
  it("prefers explicit duration", () => {
    expect(
      resolveJobDurationMinutes({
        durationMinutes: 95,
        serviceType: "standard",
        bedrooms: 2,
        bathrooms: 1,
      }),
    ).toBe(95);
  });

  it("falls back to pricing rules by service type", () => {
    const standard = resolveJobDurationMinutes({
      serviceType: "standard",
      bedrooms: 2,
      bathrooms: 1,
      squareFootage: 1500,
      extrasCount: 0,
    });
    const deep = resolveJobDurationMinutes({
      serviceType: "deep",
      bedrooms: 2,
      bathrooms: 1,
      squareFootage: 1500,
      extrasCount: 0,
    });
    expect(deep).toBeGreaterThan(standard);
    expect(standard).toBeGreaterThanOrEqual(120);
  });
});

describe("suggestArrivalWindows", () => {
  it("returns morning/afternoon/evening for a date", () => {
    const windows = suggestArrivalWindows({
      marketId: "TORONTO_GTA",
      date: "2026-08-12",
      durationMinutes: 120,
    });
    expect(windows).toHaveLength(3);
    expect(windows.map((w) => w.id)).toEqual(["morning", "afternoon", "evening"]);
    expect(windows.every((w) => w.available)).toBe(true);
    expect(windows[0]!.supplyEstimate).toBeNull();
  });

  it("marks low-supply windows unavailable when capacity provided", () => {
    const windows = suggestArrivalWindows({
      marketId: "TORONTO_GTA",
      date: "2026-08-12",
      durationMinutes: 90,
      supplyByWindow: { morning: 3, afternoon: 0, evening: 1 },
      minSupply: 1,
    });
    expect(windows.find((w) => w.id === "morning")?.available).toBe(true);
    expect(windows.find((w) => w.id === "afternoon")?.available).toBe(false);
    expect(windows.find((w) => w.id === "evening")?.available).toBe(true);
  });

  it("returns empty for invalid date", () => {
    expect(
      suggestArrivalWindows({
        marketId: "TORONTO_GTA",
        date: "not-a-date",
        durationMinutes: 60,
      }),
    ).toEqual([]);
  });
});

describe("checkCleanerAvailability + travel buffer", () => {
  it("prevents double-booking with travel buffer between jobs", () => {
    const result = checkCleanerAvailability({
      cleanerId: "c1",
      scheduledAt: "2026-08-12T14:00:00.000Z",
      durationMinutes: 60,
      travelBufferMinutes: 30,
      existingJobs: [
        {
          bookingId: "existing",
          scheduledAt: "2026-08-12T15:20:00.000Z",
          durationMinutes: 60,
        },
      ],
    });
    expect(result.isAvailable).toBe(false);
    expect(result.reason).toBe("travel_conflict");
  });
});
