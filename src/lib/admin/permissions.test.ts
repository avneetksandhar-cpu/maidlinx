import { describe, expect, it } from "vitest";
import { hasPermission, ADMIN_ROLE_PRESETS } from "@/lib/admin/permissions";

describe("admin permissions", () => {
  it("grants super_admin every permission regardless of list", () => {
    expect(hasPermission([], "bookings.write", "super_admin")).toBe(true);
    expect(hasPermission([], "support.write", "super_admin")).toBe(true);
  });

  it("requires explicit permission for operators", () => {
    const perms = ADMIN_ROLE_PRESETS.operator ?? [];
    expect(hasPermission(perms, "bookings.write", "operator")).toBe(true);
    expect(hasPermission(perms, "permissions.write", "operator")).toBe(false);
  });

  it("keeps support role away from pricing writes", () => {
    const perms = ADMIN_ROLE_PRESETS.support ?? [];
    expect(hasPermission(perms, "support.write", "support")).toBe(true);
    expect(hasPermission(perms, "pricing.write", "support")).toBe(false);
    expect(hasPermission(perms, "bookings.write", "support")).toBe(false);
  });

  it("denies missing permission when role is not super_admin", () => {
    expect(hasPermission(["bookings.read"], "bookings.write", "operator")).toBe(false);
  });
});
