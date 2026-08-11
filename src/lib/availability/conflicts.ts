/**
 * Pure schedule conflict math for dispatch / eligibility / assignment.
 * Accounts for job duration, travel buffer, and next booking.
 */

export type ConflictReason =
  | "overlap"
  | "travel_conflict"
  | "outside_window"
  | "inactive"
  | "unknown";

export interface JobInterval {
  bookingId: string;
  startMs: number;
  endMs: number;
  /** Buffered start (travel before). */
  bufferedStartMs: number;
  /** Buffered end (travel after). */
  bufferedEndMs: number;
}

export interface ProposedJobInput {
  bookingId: string;
  scheduledAt: string;
  durationMinutes: number;
  travelBufferMinutes?: number;
}

export interface ExistingJobInput {
  bookingId: string;
  scheduledAt: string;
  durationMinutes: number;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  reason?: ConflictReason;
  detail?: string;
  conflictingBookingId?: string;
}

export function toInterval(
  job: ExistingJobInput | ProposedJobInput,
  travelBufferMinutes: number,
): JobInterval | null {
  const start = new Date(job.scheduledAt).getTime();
  if (Number.isNaN(start)) return null;
  const duration = Math.max(1, job.durationMinutes) * 60_000;
  const buffer = Math.max(0, travelBufferMinutes) * 60_000;
  const end = start + duration;
  return {
    bookingId: job.bookingId,
    startMs: start,
    endMs: end,
    bufferedStartMs: start - buffer,
    bufferedEndMs: end + buffer,
  };
}

export function intervalsConflict(a: JobInterval, b: JobInterval): ConflictCheckResult {
  // Hard overlap of actual job windows.
  if (a.startMs < b.endMs && b.startMs < a.endMs) {
    return {
      hasConflict: true,
      reason: "overlap",
      detail: "Overlaps an existing booking",
      conflictingBookingId: b.bookingId,
    };
  }

  // Travel buffer: proposed buffered window must not overlap other buffered windows.
  if (a.bufferedStartMs < b.bufferedEndMs && b.bufferedStartMs < a.bufferedEndMs) {
    return {
      hasConflict: true,
      reason: "travel_conflict",
      detail: "Travel buffer conflicts with another booking",
      conflictingBookingId: b.bookingId,
    };
  }

  return { hasConflict: false };
}

/**
 * Check proposed job against existing jobs for the same cleaner.
 * `ignoreBookingId` lets reassignment re-check without self-conflict.
 */
export function findScheduleConflict(input: {
  proposed: ProposedJobInput;
  existing: ExistingJobInput[];
  travelBufferMinutes: number;
  ignoreBookingId?: string;
}): ConflictCheckResult {
  const proposed = toInterval(input.proposed, input.travelBufferMinutes);
  if (!proposed) {
    return { hasConflict: true, reason: "unknown", detail: "Invalid proposed schedule" };
  }

  for (const job of input.existing) {
    if (input.ignoreBookingId && job.bookingId === input.ignoreBookingId) continue;
    const existing = toInterval(job, input.travelBufferMinutes);
    if (!existing) continue;
    const result = intervalsConflict(proposed, existing);
    if (result.hasConflict) return result;
  }

  return { hasConflict: false };
}

/** True when scheduled day/window matches weekly availability slots. */
export function isWithinAvailabilityWindow(input: {
  scheduledAt: string;
  slots: Array<{ dayOfWeek: number; arrivalWindow: string; isAvailable: boolean }>;
  windowId: string | null;
}): boolean {
  const { slots, windowId } = input;
  if (!slots.length) return true; // unknown → not a hard fail here

  const day = new Date(input.scheduledAt).getDay();
  if (Number.isNaN(day)) return false;

  const daySlots = slots.filter((s) => s.dayOfWeek === day && s.isAvailable);
  if (daySlots.length === 0) return false;
  if (!windowId) return true;
  return daySlots.some((s) => s.arrivalWindow === windowId);
}
