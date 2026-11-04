import { describe, expect, it } from "vitest";
import {
  formatEntryInstructionsForCrew,
  parseVisitEntryInstructions,
} from "@/lib/commercial/entry-instructions";

describe("entry instructions", () => {
  it("parses structured visit entry from booking_answers", () => {
    const entry = parseVisitEntryInstructions({
      commercial: true,
      entryInstructions: {
        method: "reception",
        note: "Ask for Avnee",
        applyTo: "future_visits",
        updatedAt: "2026-11-04T12:00:00.000Z",
      },
    });
    expect(entry?.method).toBe("reception");
    expect(entry?.note).toBe("Ask for Avnee");
    expect(entry?.applyTo).toBe("future_visits");
  });

  it("returns null for missing or invalid entry", () => {
    expect(parseVisitEntryInstructions(null)).toBeNull();
    expect(parseVisitEntryInstructions({ commercial: true })).toBeNull();
    expect(
      parseVisitEntryInstructions({
        entryInstructions: { method: "teleport", note: "" },
      }),
    ).toBeNull();
  });

  it("formats crew-facing line without inventing codes", () => {
    expect(
      formatEntryInstructionsForCrew({
        method: "call_on_arrival",
        note: "Ring suite 400",
        applyTo: "this_visit",
        updatedAt: "2026-11-04T12:00:00.000Z",
      }),
    ).toBe("Call on arrival. Ring suite 400");

    expect(
      formatEntryInstructionsForCrew({
        method: "designated_entrance",
        note: "  ",
        applyTo: "this_visit",
        updatedAt: "2026-11-04T12:00:00.000Z",
      }),
    ).toBe("Use a designated entrance");
  });
});
