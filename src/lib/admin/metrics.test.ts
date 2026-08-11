import { describe, expect, it } from "vitest";
import { EMPTY_DASHBOARD_METRICS } from "@/lib/admin/metrics";
import {
  updateBookingStatusSchema,
  assignCleanerSchema,
  cancelAssignmentSchema,
  cancelBookingSchema,
} from "@/lib/validations/admin";

describe("admin dashboard metrics", () => {
  it("provides empty defaults for unconfigured environments", () => {
    expect(EMPTY_DASHBOARD_METRICS).toEqual({
      bookingsToday: 0,
      revenueTodayCents: 0,
      activeCleaners: 0,
      pendingAssignments: 0,
      completedBookings: 0,
    });
  });
});

describe("admin booking validations", () => {
  it("accepts marketplace status updates", () => {
    expect(updateBookingStatusSchema.safeParse({ status: "assigned" }).success).toBe(true);
    expect(updateBookingStatusSchema.safeParse({ status: "awaiting_assignment" }).success).toBe(
      true,
    );
  });

  it("rejects invalid status updates", () => {
    expect(updateBookingStatusSchema.safeParse({ status: "invalid" }).success).toBe(false);
  });

  it("requires uuid for cleaner assignment", () => {
    const valid = assignCleanerSchema.safeParse({
      professionalProfileId: "550e8400-e29b-41d4-a716-446655440000",
    });
    const invalid = assignCleanerSchema.safeParse({ professionalProfileId: "not-a-uuid" });
    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });

  it("accepts cancel assignment and cancel booking actions", () => {
    expect(cancelAssignmentSchema.safeParse({ action: "cancel_assignment" }).success).toBe(true);
    expect(cancelBookingSchema.safeParse({ action: "cancel", reason: "No show" }).success).toBe(
      true,
    );
  });
});
