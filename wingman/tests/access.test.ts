import { describe, expect, it } from "vitest";
import { canAccessPath, isProtectedPath, isPublicPath } from "@/lib/auth/access";
import { hashPassword, validatePassword, verifyPassword } from "@/lib/auth/password";
import { DEFAULT_PERMISSIONS } from "@/lib/auth/types";

describe("access control helpers", () => {
  it("treats marketing and auth as public", () => {
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("/auth")).toBe(true);
    expect(isPublicPath("/auth/reset/confirm")).toBe(true);
    expect(isPublicPath("/experiences/liv")).toBe(true);
    expect(isPublicPath("/events")).toBe(true);
    expect(isPublicPath("/events/EVT-0001")).toBe(true);
    expect(isPublicPath("/plan")).toBe(true);
    expect(isPublicPath("/book")).toBe(true);
    expect(isPublicPath("/home")).toBe(true);
    expect(isPublicPath("/cart")).toBe(true);
    expect(isPublicPath("/api/catalog")).toBe(true);
    expect(isPublicPath("/booking/location")).toBe(true);
    expect(isPublicPath("/booking/when")).toBe(true);
    expect(isPublicPath("/booking/matches")).toBe(true);
    expect(isPublicPath("/policies")).toBe(true);
    expect(isPublicPath("/wingmen")).toBe(true);
    expect(isPublicPath("/venues")).toBe(true);
    expect(isPublicPath("/venues/liv")).toBe(true);
    expect(isPublicPath("/venues/apply")).toBe(true);
    expect(isPublicPath("/api/interest")).toBe(true);
  });

  it("protects member and staff routes", () => {
    expect(isProtectedPath("/home")).toBe(false);
    expect(isProtectedPath("/booking/when")).toBe(false);
    expect(isProtectedPath("/booking/payment")).toBe(true);
    expect(isProtectedPath("/booking/confirm")).toBe(true);
    expect(isProtectedPath("/admin")).toBe(true);
    expect(isProtectedPath("/owner")).toBe(true);
    expect(isProtectedPath("/partner")).toBe(true);
    expect(isProtectedPath("/operator")).toBe(true);
    expect(isProtectedPath("/request")).toBe(true);
    expect(isProtectedPath("/profile")).toBe(true);
    expect(isProtectedPath("/account")).toBe(true);
    expect(isProtectedPath("/receipts/abc")).toBe(true);
    expect(isProtectedPath("/book")).toBe(false);
    expect(isProtectedPath("/venue")).toBe(true);
    expect(isProtectedPath("/orders/abc")).toBe(true);
    expect(isProtectedPath("/cart")).toBe(false);
  });

  it("enforces role routes", () => {
    expect(canAccessPath("member", "/home")).toBe(true);
    expect(canAccessPath("member", "/admin")).toBe(false);
    expect(canAccessPath("member", "/owner")).toBe(false);
    expect(canAccessPath("member", "/partner")).toBe(false);
    expect(canAccessPath("partner", "/partner")).toBe(true);
    expect(canAccessPath("partner", "/admin")).toBe(false);
    expect(canAccessPath("admin", "/admin")).toBe(true);
    expect(canAccessPath("admin", "/operator")).toBe(true);
    expect(canAccessPath("member", "/operator")).toBe(false);
    expect(canAccessPath("admin", "/owner")).toBe(false);
    expect(canAccessPath("owner", "/admin")).toBe(true);
    expect(canAccessPath("owner", "/owner")).toBe(true);
    expect(canAccessPath("owner", "/partner")).toBe(true);
  });
});

describe("passwords", () => {
  it("hashes and verifies", () => {
    const hash = hashPassword("CorrectHorse1!");
    expect(verifyPassword("CorrectHorse1!", hash)).toBe(true);
    expect(verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("rejects short passwords", () => {
    expect(validatePassword("short")).toBeTruthy();
    expect(validatePassword("long-enough-password")).toBeNull();
  });
});

describe("permission defaults", () => {
  it("does not make guest-list a security role", () => {
    expect(DEFAULT_PERMISSIONS.member.guestList).toBe(false);
    expect(DEFAULT_PERMISSIONS.partner.hostExperiences).toBe(true);
    expect(DEFAULT_PERMISSIONS.partner.promoteEvents).toBe(true);
  });
});
