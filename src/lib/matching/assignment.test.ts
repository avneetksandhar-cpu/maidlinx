import { describe, expect, it } from "vitest";

/**
 * Concurrency semantics for offer accept / admin reassignment.
 * DB unique indexes + optimistic booking update enforce these invariants;
 * unit tests document the expected race outcomes without a live Supabase.
 */

describe("assignment concurrency contracts", () => {
  it("documents optimistic lock claim order for simultaneous accept", () => {
    // Simulated race: two cleaners attempt claim; only first null→assigned wins.
    let professionalProfileId: string | null = null;
    const claim = (cleanerUserId: string) => {
      if (professionalProfileId !== null) return false;
      professionalProfileId = cleanerUserId;
      return true;
    };

    const first = claim("cleaner-a");
    const second = claim("cleaner-b");

    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(professionalProfileId).toBe("cleaner-a");
  });

  it("documents reassignment replaces prior active cleaner", () => {
    let activeCleanerId: string | null = "cleaner-a";
    const reassign = (nextId: string) => {
      const previous = activeCleanerId;
      activeCleanerId = nextId;
      return { previous, active: activeCleanerId };
    };

    const result = reassign("cleaner-b");
    expect(result.previous).toBe("cleaner-a");
    expect(result.active).toBe("cleaner-b");
  });

  it("documents unique active assignment invariant", () => {
    const activeByBooking = new Map<string, string>();
    const insertActive = (bookingId: string, cleanerId: string) => {
      if (activeByBooking.has(bookingId)) {
        throw new Error("unique_violation");
      }
      activeByBooking.set(bookingId, cleanerId);
    };

    insertActive("b1", "c1");
    expect(() => insertActive("b1", "c2")).toThrow(/unique_violation/);
    expect(activeByBooking.get("b1")).toBe("c1");
  });
});
