/**
 * FUTURE: Multi-job schedule / batch optimization (Marketplace V4).
 *
 * V1 matching ranks one booking at a time. This module defines the contract
 * for optimizing a cleaner's day across multiple jobs (travel chaining,
 * window packing). Do NOT invent fake optimizer results here.
 *
 * @see docs/MARKETPLACE_ROADMAP.md §V4
 * @see docs/ALGORITHMS.md §1
 */

export interface BatchJobCandidate {
  bookingId: string;
  scheduledAt: string;
  durationMinutes: number;
  latitude: number | null;
  longitude: number | null;
  /** Soft preference window start/end (ISO), if any. */
  windowStart?: string | null;
  windowEnd?: string | null;
}

export interface BatchCleanerDay {
  cleanerProfileId: string;
  /** Jobs already assigned that day. */
  existingJobs: BatchJobCandidate[];
  /** Home / last known position for travel estimates. */
  originLatitude: number | null;
  originLongitude: number | null;
  travelBufferMinutes: number;
}

export interface BatchOptimizeInput {
  cleaner: BatchCleanerDay;
  /** Unassigned jobs to consider packing into this day. */
  candidates: BatchJobCandidate[];
  /** Soft cap on jobs per cleaner per day. */
  maxJobsPerDay?: number;
}

export interface BatchOptimizeResult {
  /** Ordered plan (existing + newly accepted candidates). */
  orderedJobIds: string[];
  /** Candidate booking ids accepted into the plan. */
  acceptedBookingIds: string[];
  /** Estimated total travel minutes across the day. */
  estimatedTravelMinutes: number;
  notes: string[];
}

/**
 * TODO(V4): Optimize multi-job sequences for a cleaner day.
 * - Minimize chained travel (closest ≠ quickest across a route)
 * - Respect duration + travel buffers + availability windows
 * - Optionally rebalance when jobs cancel mid-day
 *
 * Until implemented, callers must continue using single-booking
 * `rankCleanersForBooking` + `checkCleanerAvailability`.
 */
export function optimizeCleanerDaySchedule(
  input: BatchOptimizeInput,
): BatchOptimizeResult {
  void input;
  throw new Error(
    "TODO: src/lib/matching/batch — multi-job schedule optimization not implemented (Marketplace V4)",
  );
}
