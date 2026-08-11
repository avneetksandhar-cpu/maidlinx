/**
 * Availability algorithm — prevent double-booking; account for travel + job duration.
 * @see docs/ALGORITHMS.md §2
 * @see docs/MARKETPLACE_ROADMAP.md
 *
 * Cleaner weekly preference CRUD: `src/lib/pro/dashboard/availability.ts`.
 * This module owns conflict / eligibility math for dispatch, assign, and
 * future slot generation (`suggestArrivalWindows`).
 */

import {
  findScheduleConflict,
  isWithinAvailabilityWindow,
  type ConflictReason,
  type ExistingJobInput,
} from "@/lib/availability/conflicts";
import { MATCH_THRESHOLDS } from "@/lib/matching/config";
import { arrivalWindowFromScheduledAt } from "@/lib/matching/calculateMatchScore";

export type AvailabilityBlockReason = ConflictReason;

export interface AvailabilityCheckInput {
  cleanerId: string;
  scheduledAt: string;
  windowEnd?: string;
  durationMinutes: number;
  travelBufferMinutes?: number;
  ignoreBookingId?: string;
  /** Preloaded existing jobs for this cleaner (required for conflict check). */
  existingJobs?: ExistingJobInput[];
  /** Weekly preference slots; empty/undefined → do not hard-fail on window. */
  availabilitySlots?: Array<{
    dayOfWeek: number;
    arrivalWindow: string;
    isAvailable: boolean;
  }>;
}

export interface AvailabilityCheckResult {
  isAvailable: boolean;
  reason?: AvailabilityBlockReason;
  detail?: string;
  conflictingBookingId?: string;
}

export interface FreeSlot {
  start: string;
  end: string;
}

/**
 * Overlap + travel-buffer + weekly-window check.
 * Pure when `existingJobs` / slots are provided by the caller.
 *
 * Used by matching eligibility AND assign/accept paths.
 */
export function checkCleanerAvailability(
  input: AvailabilityCheckInput,
): AvailabilityCheckResult {
  const travelBufferMinutes =
    input.travelBufferMinutes ?? MATCH_THRESHOLDS.travelBufferMinutes;
  const durationMinutes = Math.max(
    1,
    input.durationMinutes || MATCH_THRESHOLDS.defaultJobDurationMinutes,
  );
  const existing = input.existingJobs ?? [];

  const conflict = findScheduleConflict({
    proposed: {
      bookingId: input.ignoreBookingId ?? "proposed",
      scheduledAt: input.scheduledAt,
      durationMinutes,
      travelBufferMinutes,
    },
    existing,
    travelBufferMinutes,
    ignoreBookingId: input.ignoreBookingId,
  });

  if (conflict.hasConflict) {
    return {
      isAvailable: false,
      reason: conflict.reason,
      detail: conflict.detail,
      conflictingBookingId: conflict.conflictingBookingId,
    };
  }

  if (input.availabilitySlots && input.availabilitySlots.length > 0) {
    const windowId = arrivalWindowFromScheduledAt(input.scheduledAt);
    const inWindow = isWithinAvailabilityWindow({
      scheduledAt: input.scheduledAt,
      slots: input.availabilitySlots,
      windowId,
    });
    if (!inWindow) {
      return {
        isAvailable: false,
        reason: "outside_window",
        detail: "Outside cleaner weekly availability window",
      };
    }
  }

  return { isAvailable: true };
}

/**
 * List free windows for a date range.
 * Prefer `suggestArrivalWindows` for customer-facing slot hints;
 * this remains for cleaner-day calendar UI (V2).
 */
export function listFreeSlots(
  cleanerId: string,
  fromIso: string,
  toIso: string,
): FreeSlot[] {
  void cleanerId;
  void fromIso;
  void toIso;
  return [];
}

export {
  findScheduleConflict,
  intervalsConflict,
  isWithinAvailabilityWindow,
  toInterval,
} from "@/lib/availability/conflicts";

export {
  resolveJobDurationMinutes,
  type JobDurationInput,
} from "@/lib/availability/duration";

export {
  suggestArrivalWindows,
  type SuggestedArrivalWindow,
  type SuggestArrivalWindowsInput,
} from "@/lib/availability/windows";

export {
  generateAvailableSlots,
  type GeneratedSlot,
  type GenerateSlotsInput,
} from "@/lib/availability/slots";
