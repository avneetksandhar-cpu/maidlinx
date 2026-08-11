import { describe, expect, it } from "vitest";
import { validateBookingStatusTransition } from "@/lib/bookings/status";
import { validateCleanerStatusTransition } from "@/lib/pro/job-transitions";

describe("booking authorization / status transitions", () => {
  it("prevents customers from jumping to completed", () => {
    expect(validateBookingStatusTransition("pending_payment", "completed").valid).toBe(false);
    expect(validateBookingStatusTransition("awaiting_assignment", "completed").valid).toBe(false);
  });

  it("prevents cleaners from skipping arrival", () => {
    expect(validateCleanerStatusTransition("accepted", "in_progress").valid).toBe(false);
    expect(validateCleanerStatusTransition("on_the_way", "completed").valid).toBe(false);
  });

  it("allows only claim statuses from open jobs", () => {
    expect(validateCleanerStatusTransition("awaiting_assignment", "accepted").valid).toBe(true);
    expect(validateCleanerStatusTransition("awaiting_assignment", "assigned").valid).toBe(true);
    expect(validateCleanerStatusTransition("offered", "accepted").valid).toBe(true);
  });
});
