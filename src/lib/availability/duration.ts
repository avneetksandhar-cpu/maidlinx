/**
 * Job duration helpers for availability + matching eligibility.
 * Prefer pricing engine estimates; fall back to match thresholds.
 */

import { MATCH_THRESHOLDS } from "@/lib/matching/config";
import { estimateDurationMinutes } from "@/lib/pricing";
import type { BookingServiceId } from "@/lib/bookings/constants";
import { BOOKING_SERVICES } from "@/lib/bookings/constants";

const SERVICE_IDS = new Set<string>(BOOKING_SERVICES.map((s) => s.id));

function asServiceId(serviceType: string): BookingServiceId {
  if (SERVICE_IDS.has(serviceType)) return serviceType as BookingServiceId;
  return "standard";
}

export interface JobDurationInput {
  /** Explicit duration when already known (booking.estimated_duration_minutes). */
  durationMinutes?: number | null;
  serviceType?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  squareFootage?: number | null;
  extrasCount?: number | null;
}

/**
 * Resolve job duration for conflict checks and matching.
 * Order: explicit → pricing rules → config default.
 */
export function resolveJobDurationMinutes(input: JobDurationInput): number {
  if (
    input.durationMinutes != null &&
    Number.isFinite(input.durationMinutes) &&
    input.durationMinutes > 0
  ) {
    return Math.round(input.durationMinutes);
  }

  if (input.serviceType) {
    return estimateDurationMinutes({
      serviceType: asServiceId(input.serviceType),
      bedrooms: Math.max(0, input.bedrooms ?? 0),
      bathrooms: Math.max(0, input.bathrooms ?? 0),
      squareFootage: Math.max(0, input.squareFootage ?? 1500),
      extrasCount: Math.max(0, input.extrasCount ?? 0),
    });
  }

  return MATCH_THRESHOLDS.defaultJobDurationMinutes;
}
