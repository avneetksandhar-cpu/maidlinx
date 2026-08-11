import { afterEach, describe, expect, it } from "vitest";
import {
  BOOKING_ANALYTICS_EVENTS,
  setBookingFunnelSink,
  trackFunnelEvent,
  trackFunnelStep,
} from "@/lib/analytics/booking-funnel";

describe("booking funnel analytics", () => {
  afterEach(() => {
    setBookingFunnelSink(null);
  });

  it("lists the product analytics events", () => {
    expect(BOOKING_ANALYTICS_EVENTS).toContain("funnel_estimate");
    expect(BOOKING_ANALYTICS_EVENTS).toContain("funnel_rebook");
    expect(BOOKING_ANALYTICS_EVENTS).toContain("booking_completed");
  });

  it("emits step events through the sink", () => {
    const seen: Array<{ event: string; step?: string }> = [];
    setBookingFunnelSink((event, props) => {
      seen.push({ event, step: props?.step as string | undefined });
    });

    trackFunnelStep("address", { marketId: "TORONTO_GTA" });
    trackFunnelStep("property");
    trackFunnelStep("details");
    trackFunnelStep("extras");
    trackFunnelStep("review");
    trackFunnelStep("payment");
    trackFunnelStep("pay");
    trackFunnelEvent("funnel_completed", { bookingId: "b1" });

    expect(seen.map((s) => s.event)).toEqual([
      "funnel_address",
      "funnel_property",
      "funnel_details",
      "funnel_extras",
      "funnel_review",
      "funnel_payment",
      "funnel_pay",
      "funnel_completed",
    ]);
    expect(seen[0]!.step).toBe("address");
  });

  it("swallows sink errors", () => {
    setBookingFunnelSink(() => {
      throw new Error("boom");
    });
    expect(() => trackFunnelStep("schedule")).not.toThrow();
  });
});
