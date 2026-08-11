import { describe, expect, it, vi } from "vitest";
import { setBookingAnalyticsSink, trackBookingEvent } from "@/lib/analytics/booking";

describe("booking analytics", () => {
  it("forwards events to the configured sink", () => {
    const sink = vi.fn();
    setBookingAnalyticsSink(sink);
    trackBookingEvent("address_selected", { placeId: "abc" });
    expect(sink).toHaveBeenCalledWith("address_selected", { placeId: "abc" });
  });

  it("swallows sink errors", () => {
    setBookingAnalyticsSink(() => {
      throw new Error("boom");
    });
    expect(() => trackBookingEvent("checkout_started")).not.toThrow();
  });
});
