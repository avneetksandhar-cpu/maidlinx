import { describe, expect, it } from "vitest";
import { isLiveLocationFresh, LIVE_LOCATION_FRESH_MS } from "@/lib/location/freshness";

describe("isLiveLocationFresh", () => {
  const now = Date.parse("2026-11-04T18:00:00.000Z");

  it("is fresh within the window", () => {
    const updatedAt = new Date(now - 30_000).toISOString();
    expect(isLiveLocationFresh(updatedAt, now)).toBe(true);
  });

  it("is stale after the window", () => {
    const updatedAt = new Date(now - LIVE_LOCATION_FRESH_MS - 1).toISOString();
    expect(isLiveLocationFresh(updatedAt, now)).toBe(false);
  });

  it("rejects missing or invalid stamps", () => {
    expect(isLiveLocationFresh(null, now)).toBe(false);
    expect(isLiveLocationFresh("not-a-date", now)).toBe(false);
  });
});
