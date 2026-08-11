import { describe, expect, it } from "vitest";

/**
 * Documents payout ledger contracts for job completion.
 * Live insert covered by recordPendingPayoutForCompletedBooking (needs admin env).
 */

describe("pending payout on complete contracts", () => {
  it("uses cleaner subtotal as earnings amount", () => {
    const booking = {
      subtotal_cents: 18_000,
      platform_fee_cents: 4_500,
      total_cents: 22_500,
    };
    const amountCents = booking.subtotal_cents;
    expect(amountCents).toBe(18_000);
    expect(amountCents + booking.platform_fee_cents).toBe(booking.total_cents);
  });

  it("requires approved + active cleaner for admin assign", () => {
    const canAssign = (cleaner: { approved: boolean; isActive: boolean }) =>
      cleaner.approved && cleaner.isActive;

    expect(canAssign({ approved: true, isActive: true })).toBe(true);
    expect(canAssign({ approved: false, isActive: true })).toBe(false);
    expect(canAssign({ approved: true, isActive: false })).toBe(false);
  });
});
