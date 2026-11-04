import { describe, expect, it } from "vitest";
import {
  buildBusinessEventIdempotencyKey,
  isCriticalBusinessEventType,
} from "@/lib/events/business-events";

describe("business events", () => {
  it("identifies critical booking/payment event types", () => {
    expect(isCriticalBusinessEventType("booking_created")).toBe(true);
    expect(isCriticalBusinessEventType("payment_succeeded")).toBe(true);
    expect(isCriticalBusinessEventType("offer_accepted")).toBe(true);
    expect(isCriticalBusinessEventType("job_completed")).toBe(true);
    expect(isCriticalBusinessEventType("cancelled")).toBe(true);
    expect(isCriticalBusinessEventType("rating_submitted")).toBe(true);
    expect(isCriticalBusinessEventType("cleaner_on_the_way")).toBe(false);
  });

  it("builds stable idempotency keys", () => {
    const a = buildBusinessEventIdempotencyKey({
      eventType: "payment_succeeded",
      entityType: "booking",
      entityId: "b1",
      discriminator: "pi_123",
    });
    const b = buildBusinessEventIdempotencyKey({
      eventType: "payment_succeeded",
      entityType: "booking",
      entityId: "b1",
      discriminator: "pi_123",
    });
    expect(a).toBe(b);
    expect(a).toBe("payment_succeeded:booking:b1:pi_123");
  });
});
