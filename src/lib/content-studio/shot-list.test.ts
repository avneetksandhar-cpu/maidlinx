import { describe, expect, it } from "vitest";
import { buildTimestampedShotList, slugifyTitle } from "@/lib/content-studio/shot-list";

describe("content-studio shot-list", () => {
  it("builds timestamped shots covering dialogue + end card", () => {
    const shots = buildTimestampedShotList({
      title: "Test Ep",
      genre: "comedy",
      hook: "A hook",
      durationSeconds: 15,
      characters: ["lexi", "nia"],
      location: "Condo",
      story: "Mess then clean",
      dialogue: [
        { speaker: "CALLER", line: "Hello" },
        { speaker: "Lexi", line: "What?" },
      ],
      cta: "maidlinx.com",
      platform: "tiktok",
    });

    expect(shots.length).toBeGreaterThanOrEqual(4);
    expect(shots[0]?.startSec).toBe(0);
    expect(shots.some((s) => s.endCard)).toBe(true);
    const last = shots[shots.length - 1]!;
    expect(last.startSec + last.durationSec).toBeGreaterThan(10);
  });

  it("slugifies titles", () => {
    expect(slugifyTitle("I Know What You Spilled Last Night")).toBe(
      "i-know-what-you-spilled-last-night",
    );
  });
});
