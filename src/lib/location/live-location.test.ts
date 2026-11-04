import { describe, expect, it } from "vitest";
import {
  canCustomerReadLiveLocation,
  canShareLiveLocation,
} from "@/lib/location/live-location";
import { isLiveLocationStatus } from "@/lib/bookings/status";

describe("live location privacy gates", () => {
  it("allows share/read only for on_the_way and arrived", () => {
    expect(canShareLiveLocation("on_the_way")).toBe(true);
    expect(canShareLiveLocation("arrived")).toBe(true);
    expect(canShareLiveLocation("cleaner_on_way")).toBe(true);
    expect(canShareLiveLocation("accepted")).toBe(false);
    expect(canShareLiveLocation("in_progress")).toBe(false);
    expect(canShareLiveLocation("completed")).toBe(false);
    expect(canShareLiveLocation("cancelled")).toBe(false);
  });

  it("requires an assigned cleaner for customer reads", () => {
    expect(
      canCustomerReadLiveLocation({ status: "on_the_way", hasAssignedCleaner: true }),
    ).toBe(true);
    expect(
      canCustomerReadLiveLocation({ status: "on_the_way", hasAssignedCleaner: false }),
    ).toBe(false);
    expect(
      canCustomerReadLiveLocation({ status: "assigned", hasAssignedCleaner: true }),
    ).toBe(false);
  });

  it("normalizes legacy status aliases", () => {
    expect(isLiveLocationStatus("cleaner_arrived")).toBe(true);
    expect(isLiveLocationStatus("EN_ROUTE")).toBe(false);
  });
});
