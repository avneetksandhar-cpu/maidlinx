import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ATMOSPHERE_DISCLAIMER,
  ATMOSPHERE_PHOTOS,
  atmosphereCopyIsSafe,
  atmosphereForEvent,
  atmosphereForPlanOption,
  EMPTY_STATE_PHOTO,
  HERO_PHOTO,
} from "@/lib/photos/atmosphere";

describe("licensed atmosphere catalog", () => {
  it("ships a local file and a real license for every photo", () => {
    expect(ATMOSPHERE_PHOTOS.length).toBeGreaterThanOrEqual(8);
    for (const photo of ATMOSPHERE_PHOTOS) {
      expect(existsSync(resolve(process.cwd(), "public", photo.src.replace(/^\//, "")))).toBe(true);
      expect(photo.licenseUrl).toMatch(/unsplash\.com\/license|pexels\.com\/license/);
      expect(photo.sourceUrl).toMatch(/^https:\/\//);
      expect(photo.src.startsWith("/photos/")).toBe(true);
    }
  });

  it("keeps captions and alt text as atmosphere, not inventory or dating", () => {
    expect(atmosphereCopyIsSafe(ATMOSPHERE_DISCLAIMER)).toBe(true);
    for (const photo of ATMOSPHERE_PHOTOS) {
      expect(atmosphereCopyIsSafe(photo.alt)).toBe(true);
      expect(atmosphereCopyIsSafe(photo.caption)).toBe(true);
      expect(photo.caption).toContain("not Wingmen");
      expect(photo.objectPosition).toMatch(/center/);
    }
    expect(atmosphereCopyIsSafe("Meet her tonight at the table")).toBe(false);
  });

  it("picks a stable atmosphere photo without flipping usage verification", () => {
    const first = atmosphereForEvent({ id: "evt-1", category: "Nightclub" });
    const second = atmosphereForEvent({ id: "evt-1", category: "Nightclub" });
    expect(first.id).toBe(second.id);
    expect(atmosphereForEvent({ id: "dinner-1", category: "Dinner" }).mood).toMatch(
      /dining|social_table/,
    );
    expect(atmosphereForPlanOption("backup").id).toBe(HERO_PHOTO.id);
    expect(EMPTY_STATE_PHOTO.mood).toBe("miami_night");
  });
});
