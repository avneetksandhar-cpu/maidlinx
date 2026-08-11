import { describe, expect, it } from "vitest";
import { optimizeCleanerDaySchedule } from "@/lib/matching/batch";

describe("batch optimizer stub", () => {
  it("throws a clear V4 TODO (does not fake results)", () => {
    expect(() =>
      optimizeCleanerDaySchedule({
        cleaner: {
          cleanerProfileId: "pro-1",
          existingJobs: [],
          originLatitude: 43.64,
          originLongitude: -79.39,
          travelBufferMinutes: 30,
        },
        candidates: [],
      }),
    ).toThrow(/V4|not implemented/i);
  });
});
