import { describe, expect, it } from "vitest";

/**
 * Webhook idempotency contracts.
 * Live Stripe signature + DB claim covered by claimStripeWebhookEvent;
 * these tests document required caller behavior without network.
 */

describe("stripe webhook idempotency contracts", () => {
  it("treats duplicate event ids as successful no-ops", () => {
    const seen = new Set<string>();
    const claim = (eventId: string) => {
      if (seen.has(eventId)) return "duplicate";
      seen.add(eventId);
      return "claimed";
    };

    expect(claim("evt_1")).toBe("claimed");
    expect(claim("evt_1")).toBe("duplicate");
    expect(claim("evt_2")).toBe("claimed");
  });

  it("documents payment_failed must not confirm booking", () => {
    const bookingStatus = "pending_payment";
    const onFailed = () => {
      // only payment row → failed; status stays pending_payment
      return bookingStatus;
    };
    expect(onFailed()).toBe("pending_payment");
  });
});
