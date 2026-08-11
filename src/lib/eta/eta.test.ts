import { describe, expect, it } from "vitest";
import { estimateArrival, estimateTravelMinutes } from "@/lib/eta";

describe("estimateTravelMinutes", () => {
  it("returns null when coordinates missing", () => {
    expect(
      estimateTravelMinutes({
        originLatitude: null,
        originLongitude: -79.39,
        destinationLatitude: 43.65,
        destinationLongitude: -79.38,
      }),
    ).toBeNull();
  });

  it("returns haversine-based minutes with a floor", () => {
    const minutes = estimateTravelMinutes({
      originLatitude: 43.64,
      originLongitude: -79.39,
      destinationLatitude: 43.7,
      destinationLongitude: -79.4,
      averageSpeedKmh: 35,
      minMinutes: 5,
    });
    expect(minutes).not.toBeNull();
    expect(minutes!).toBeGreaterThanOrEqual(5);
    expect(minutes!).toBeLessThan(60);
  });
});

describe("estimateArrival", () => {
  it("includes travel minutes when origin + destination known", () => {
    const result = estimateArrival({
      cleanerId: "c1",
      bookingId: "b1",
      destination: { latitude: 43.7, longitude: -79.4 },
      origin: { latitude: 43.64, longitude: -79.39 },
      scheduledAt: "2026-08-12T15:00:00.000Z",
      onTheWayAt: "2026-08-12T14:30:00.000Z",
    });
    expect(result.travelMinutes).not.toBeNull();
    expect(result.etaAt).toBeTruthy();
  });
});
