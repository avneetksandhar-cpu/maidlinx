import { describe, expect, it } from "vitest";
import { shouldShowCustomerTabBar } from "@/components/customer/customer-bottom-nav";

describe("shouldShowCustomerTabBar", () => {
  it("shows on customer home and dashboard surfaces", () => {
    expect(shouldShowCustomerTabBar("/")).toBe(true);
    expect(shouldShowCustomerTabBar("/dashboard")).toBe(true);
    expect(shouldShowCustomerTabBar("/dashboard/bookings")).toBe(true);
    expect(shouldShowCustomerTabBar("/dashboard/saved-places")).toBe(true);
    expect(shouldShowCustomerTabBar("/dashboard/profile")).toBe(true);
    expect(shouldShowCustomerTabBar("/bookings/abc")).toBe(true);
  });

  it("hides mid-funnel booking slides and ops surfaces", () => {
    expect(shouldShowCustomerTabBar("/book/service")).toBe(false);
    expect(shouldShowCustomerTabBar("/book/date")).toBe(false);
    expect(shouldShowCustomerTabBar("/admin")).toBe(false);
    expect(shouldShowCustomerTabBar("/cleaner")).toBe(false);
    expect(shouldShowCustomerTabBar("/earn")).toBe(false);
  });

  it("shows on confirmation", () => {
    expect(shouldShowCustomerTabBar("/book/confirmation/xyz")).toBe(true);
  });
});
