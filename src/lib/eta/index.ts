/**
 * ETA algorithm — travel-time estimates for matching + customer tracking.
 * @see docs/ALGORITHMS.md §3
 * @see docs/MARKETPLACE_ROADMAP.md
 *
 * Principle: closest ≠ quickest. Prefer travel minutes over raw km when ranking
 * or displaying ETA. V1 uses haversine + average speed (no Maps traffic).
 */

import { haversineKm } from "@/lib/matching/geo";
import { MATCH_THRESHOLDS } from "@/lib/matching/config";

export interface EtaInput {
  cleanerId: string;
  bookingId: string;
  /** Job coordinates or address id resolved by caller. */
  destination: { latitude: number; longitude: number } | { addressId: string };
  /** Origin hint: last known point, previous job, or home base. */
  origin?: { latitude: number; longitude: number };
  /** When cleaner tapped on-the-way (ISO), if any. */
  onTheWayAt?: string;
  /** Scheduled window start (ISO). */
  scheduledAt: string;
}

export interface EtaResult {
  etaAt: string;
  /** Minutes of uncertainty band (±). */
  confidenceMinutes: number;
  lateRisk: boolean;
  /** Travel minutes used when computable. */
  travelMinutes: number | null;
}

export interface TravelMinutesInput {
  originLatitude: number | null | undefined;
  originLongitude: number | null | undefined;
  destinationLatitude: number | null | undefined;
  destinationLongitude: number | null | undefined;
  /** Override average speed (km/h). Default from match thresholds. */
  averageSpeedKmh?: number;
  /** Floor so UI never shows "0 min". */
  minMinutes?: number;
}

/**
 * Simple haversine travel minutes. Returns null when coords missing.
 * Safe for customer confirmation / dashboard ETA display.
 */
export function estimateTravelMinutes(input: TravelMinutesInput): number | null {
  const {
    originLatitude,
    originLongitude,
    destinationLatitude,
    destinationLongitude,
  } = input;

  if (
    originLatitude == null ||
    originLongitude == null ||
    destinationLatitude == null ||
    destinationLongitude == null ||
    !Number.isFinite(originLatitude) ||
    !Number.isFinite(originLongitude) ||
    !Number.isFinite(destinationLatitude) ||
    !Number.isFinite(destinationLongitude)
  ) {
    return null;
  }

  const km = haversineKm(
    { latitude: originLatitude, longitude: originLongitude },
    { latitude: destinationLatitude, longitude: destinationLongitude },
  );
  const speed = Math.max(
    5,
    input.averageSpeedKmh ?? MATCH_THRESHOLDS.averageSpeedKmh,
  );
  const minutes = Math.round((km / speed) * 60);
  const floor = input.minMinutes ?? 5;
  return Math.max(floor, minutes);
}

/**
 * Richer arrival prediction. V1: haversine travel from origin when available;
 * otherwise falls back to scheduledAt with a wide confidence band.
 *
 * TODO(V3): Maps traffic, historical lateness, live refresh after on_the_way.
 */
export function estimateArrival(input: EtaInput): EtaResult {
  const dest =
    "latitude" in input.destination
      ? input.destination
      : null;

  const travelMinutes =
    dest && input.origin
      ? estimateTravelMinutes({
          originLatitude: input.origin.latitude,
          originLongitude: input.origin.longitude,
          destinationLatitude: dest.latitude,
          destinationLongitude: dest.longitude,
        })
      : null;

  const baseMs = input.onTheWayAt
    ? new Date(input.onTheWayAt).getTime()
    : Date.now();
  const scheduledMs = new Date(input.scheduledAt).getTime();

  if (travelMinutes != null && Number.isFinite(baseMs)) {
    const etaMs = baseMs + travelMinutes * 60_000;
    const lateRisk =
      Number.isFinite(scheduledMs) && etaMs > scheduledMs + 15 * 60_000;
    return {
      etaAt: new Date(etaMs).toISOString(),
      confidenceMinutes: 12,
      lateRisk,
      travelMinutes,
    };
  }

  // No coords — surface scheduled time with low confidence (not invented traffic ETA).
  const fallbackAt = Number.isFinite(scheduledMs)
    ? new Date(scheduledMs).toISOString()
    : new Date().toISOString();

  return {
    etaAt: fallbackAt,
    confidenceMinutes: 45,
    lateRisk: false,
    travelMinutes: null,
  };
}
