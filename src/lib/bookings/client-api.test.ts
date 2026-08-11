import { describe, expect, it } from "vitest";
import { isBookingPaymentConfirmed } from "@/lib/bookings/client-api";

describe("isBookingPaymentConfirmed", () => {
  it("returns false for pending_payment", () => {
    expect(isBookingPaymentConfirmed("pending_payment")).toBe(false);
  });

  it("returns true for awaiting_assignment and downstream statuses", () => {
    expect(isBookingPaymentConfirmed("awaiting_assignment")).toBe(true);
    expect(isBookingPaymentConfirmed("assigned")).toBe(true);
    expect(isBookingPaymentConfirmed("completed")).toBe(true);
  });

  it("returns false for cancelled", () => {
    expect(isBookingPaymentConfirmed("cancelled")).toBe(false);
  });
});
