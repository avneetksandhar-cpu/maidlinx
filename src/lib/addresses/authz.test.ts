import { describe, expect, it } from "vitest";
import {
  assertAddressOwnedByUser,
  canAccessAddress,
  filterAddressesForUser,
} from "@/lib/addresses/authz";

describe("saved address authorization", () => {
  it("allows the owning customer", () => {
    expect(() => assertAddressOwnedByUser("user-a", "user-a")).not.toThrow();
    expect(canAccessAddress("user-a", "user-a")).toBe(true);
  });

  it("denies cross-customer access", () => {
    expect(() => assertAddressOwnedByUser("user-a", "user-b")).toThrow(/do not have access/);
    expect(canAccessAddress("user-a", "user-b")).toBe(false);
  });

  it("requires authentication", () => {
    expect(() => assertAddressOwnedByUser("user-a", null)).toThrow(/Authentication required/);
    expect(canAccessAddress("user-a", undefined)).toBe(false);
  });

  it("filters lists to the requester only", () => {
    const rows = [
      { id: "1", userId: "user-a" },
      { id: "2", userId: "user-b" },
      { id: "3", userId: "user-a" },
    ];
    expect(filterAddressesForUser(rows, "user-a").map((r) => r.id)).toEqual(["1", "3"]);
  });
});
