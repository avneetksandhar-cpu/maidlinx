import { describe, expect, it } from "vitest";
import { shouldShowCustomerTabBar } from "@/components/customer/customer-bottom-nav";

describe("shouldShowCustomerTabBar", () => {
  it("shows on home / bookings / properties / account roots", () => {
    expect(shouldShowCustomerTabBar("/")).toBe(true);
    expect(shouldShowCustomerTabBar("/dashboard")).toBe(true);
    expect(shouldShowCustomerTabBar("/dashboard/sites")).toBe(true);
    expect(shouldShowCustomerTabBar("/dashboard/bookings")).toBe(true);
    expect(shouldShowCustomerTabBar("/dashboard/profile")).toBe(true);
    expect(shouldShowCustomerTabBar("/bookings/abc")).toBe(true);
  });

  it("shows on public commercial intake", () => {
    expect(shouldShowCustomerTabBar("/book/commercial/property")).toBe(true);
    expect(shouldShowCustomerTabBar("/book/commercial/teams")).toBe(true);
  });

  it("hides mid-funnel residential booking slides and ops surfaces", () => {
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
