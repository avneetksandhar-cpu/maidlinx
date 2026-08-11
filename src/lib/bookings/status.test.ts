import { describe, expect, it } from "vitest";
import {
  normalizeBookingStatus,
  validateBookingStatusTransition,
  isPaidBookingStatus,
} from "@/lib/bookings/status";

describe("normalizeBookingStatus", () => {
  it("maps legacy statuses", () => {
    expect(normalizeBookingStatus("awaiting_cleaner")).toBe("awaiting_assignment");
    expect(normalizeBookingStatus("cleaner_on_way")).toBe("on_the_way");
    expect(normalizeBookingStatus("cleaner_arrived")).toBe("arrived");
  });

  it("keeps canonical statuses", () => {
    expect(normalizeBookingStatus("awaiting_assignment")).toBe("awaiting_assignment");
    expect(normalizeBookingStatus("draft")).toBe("draft");
  });
});

describe("validateBookingStatusTransition", () => {
  it("allows payment confirm path", () => {
    expect(validateBookingStatusTransition("pending_payment", "awaiting_assignment").valid).toBe(
      true,
    );
  });

  it("allows cleaner accept and job progress", () => {
    expect(validateBookingStatusTransition("awaiting_assignment", "accepted").valid).toBe(true);
    expect(validateBookingStatusTransition("accepted", "on_the_way").valid).toBe(true);
    expect(validateBookingStatusTransition("on_the_way", "arrived").valid).toBe(true);
    expect(validateBookingStatusTransition("arrived", "in_progress").valid).toBe(true);
    expect(validateBookingStatusTransition("in_progress", "completed").valid).toBe(true);
  });

  it("rejects arbitrary browser jumps", () => {
    expect(validateBookingStatusTransition("pending_payment", "completed").valid).toBe(false);
    expect(validateBookingStatusTransition("awaiting_assignment", "in_progress").valid).toBe(false);
    expect(validateBookingStatusTransition("completed", "assigned").valid).toBe(false);
  });

  it("accepts legacy from-status strings", () => {
    expect(validateBookingStatusTransition("awaiting_cleaner", "accepted").valid).toBe(true);
    expect(validateBookingStatusTransition("cleaner_on_way", "arrived").valid).toBe(true);
  });
});

describe("isPaidBookingStatus", () => {
  it("treats awaiting_assignment as paid", () => {
    expect(isPaidBookingStatus("awaiting_assignment")).toBe(true);
    expect(isPaidBookingStatus("awaiting_cleaner")).toBe(true);
    expect(isPaidBookingStatus("pending_payment")).toBe(false);
  });
});
