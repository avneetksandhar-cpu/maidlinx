import { describe, expect, it } from "vitest";
import {
  canSendMessage,
  canTransition,
  chatUnlocked,
  paymentUnlocked,
} from "@/lib/marketplace/request-machine";
import { applyStripeWebhookEvent } from "@/lib/payments/webhook";
import { assertCheckoutAllowed, assertServerPrice } from "@/lib/payments/checkout-guard";
import { readStripeEnv } from "@/lib/payments/env";
import { testFixturesEnabled } from "@/lib/test-fixtures/env";
import { eventShowsBookWithWingman } from "@/lib/marketplace/offers";

describe("private TEST booking state machine", () => {
  it("maps TEST flow onto existing statuses plus draft and in_progress", () => {
    expect(canTransition("draft", "payment_pending")).toBe(true);
    expect(canTransition("payment_pending", "paid")).toBe(true);
    expect(canTransition("paid", "confirmed")).toBe(true);
    expect(canTransition("confirmed", "in_progress")).toBe(true);
    expect(canTransition("in_progress", "completed")).toBe(true);
    expect(canTransition("draft", "cancelled")).toBe(true);
    expect(canTransition("confirmed", "refunded")).toBe(true);
    expect(canTransition("confirmed", "disputed")).toBe(true);
    expect(canTransition("submitted", "paid")).toBe(false);
    expect(canTransition("draft", "paid")).toBe(false);
  });

  it("unlocks payment from draft and chat only after paid", () => {
    expect(paymentUnlocked("draft")).toBe(true);
    expect(paymentUnlocked("submitted")).toBe(false);
    expect(chatUnlocked("draft")).toBe(false);
    expect(chatUnlocked("payment_pending")).toBe(false);
    expect(chatUnlocked("paid")).toBe(true);
    expect(chatUnlocked("in_progress")).toBe(true);
  });
});

describe("successful payment webhook", () => {
  it("moves to paid only when the event is new", () => {
    const result = applyStripeWebhookEvent({
      eventId: "evt_paid",
      type: "checkout.session.completed",
      alreadyProcessed: false,
      paymentIntentId: "pi_1",
    });
    expect(result.applied).toBe(true);
    expect(result.duplicate).toBe(false);
    expect(result.nextStatus).toBe("paid");
    expect(result.paymentIntentId).toBe("pi_1");
  });
});

describe("failed payment webhook", () => {
  it("does not mark the booking paid", () => {
    const failed = applyStripeWebhookEvent({
      eventId: "evt_fail",
      type: "payment_intent.payment_failed",
      alreadyProcessed: false,
    });
    expect(failed.applied).toBe(false);
    expect(failed.nextStatus).toBe("payment_failed");
    expect(failed.nextStatus).not.toBe("paid");
  });
});

describe("duplicate webhook", () => {
  it("is a no-op", () => {
    const second = applyStripeWebhookEvent({
      eventId: "evt_dup",
      type: "checkout.session.completed",
      alreadyProcessed: true,
    });
    expect(second.duplicate).toBe(true);
    expect(second.applied).toBe(false);
    expect(second.nextStatus).toBe("unchanged");
  });
});

describe("altered client price", () => {
  it("rejects a client amount that does not match the server quote", () => {
    expect(() =>
      assertServerPrice({ quoteTotalCents: 50_000, clientAmountCents: 1 }),
    ).toThrow(/does not match/);
    expect(() => assertServerPrice({ quoteTotalCents: 50_000, clientAmountCents: 50_000 })).not.toThrow();
    expect(() => assertServerPrice({ quoteTotalCents: 50_000 })).not.toThrow();
  });
});

describe("duplicate payment prevention", () => {
  it("blocks a second checkout after paid", () => {
    expect(() => assertCheckoutAllowed({ status: "paid", existingPaid: false })).toThrow(/Duplicate/);
    expect(() => assertCheckoutAllowed({ status: "draft", existingPaid: true })).toThrow(/Duplicate/);
    expect(() => assertCheckoutAllowed({ status: "draft", existingPaid: false })).not.toThrow();
  });
});

describe("unauthorized chat", () => {
  it("rejects a stranger and an unpaid party", () => {
    const stranger = canSendMessage({
      status: "confirmed",
      userId: "u-stranger",
      customerId: "u-customer",
      wingmanUserId: "u-wingman",
      operator: false,
    });
    expect(stranger.ok).toBe(false);
    if (!stranger.ok) expect(stranger.reason).toMatch(/Not a party/);

    const unpaid = canSendMessage({
      status: "draft",
      userId: "u-customer",
      customerId: "u-customer",
      wingmanUserId: "u-wingman",
      operator: false,
    });
    expect(unpaid.ok).toBe(false);
    if (!unpaid.ok) expect(unpaid.reason).toMatch(/after a paid/);
  });
});

describe("cancel and refund", () => {
  it("allows cancel from draft and refund from confirmed", () => {
    expect(canTransition("draft", "cancelled")).toBe(true);
    expect(canTransition("payment_pending", "cancelled")).toBe(true);
    expect(canTransition("confirmed", "refunded")).toBe(true);
    const refund = applyStripeWebhookEvent({
      eventId: "evt_ref",
      type: "charge.refunded",
      alreadyProcessed: false,
      refundedCents: 50_000,
    });
    expect(refund.applied).toBe(true);
    expect(refund.nextStatus).toBe("refunded");
  });
});

describe("TEST fixtures stay off public surfaces", () => {
  it("does not treat a discovery event as bookable without a public offer", () => {
    expect(
      eventShowsBookWithWingman({
        discoveryStatus: "discovery_ready",
        hasBookableOffer: false,
        bookingStatus: "DISCOVERY_ONLY",
      }),
    ).toBe(false);
  });

  it("reads ENABLE_TEST_FIXTURES without inventing Stripe keys", () => {
    expect(testFixturesEnabled({ ENABLE_TEST_FIXTURES: "true" })).toBe(true);
    expect(testFixturesEnabled({ ENABLE_TEST_FIXTURES: "false" })).toBe(false);
    const stripe = readStripeEnv({
      STRIPE_SECRET_KEY: "",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "",
      STRIPE_WEBHOOK_SECRET: "",
    });
    expect(stripe.ok).toBe(false);
  });
});
