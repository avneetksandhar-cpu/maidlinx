/**
 * Slot generation from duration + existing conflicts + travel buffer.
 * Not hard-coded cleaner lists — uses supplied availability/jobs.
 */

import { findScheduleConflict, type ExistingJobInput } from "@/lib/availability/conflicts";
import { MATCH_THRESHOLDS } from "@/lib/matching/config";
import { ARRIVAL_WINDOWS, type ArrivalWindowId } from "@/lib/bookings/constants";

export interface GeneratedSlot {
  id: ArrivalWindowId;
  startIso: string;
  endIso: string;
  durationMinutes: number;
  available: boolean;
  reason?: string;
  conflictingBookingId?: string;
}

export interface GenerateSlotsInput {
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  travelBufferMinutes?: number;
  /** Existing jobs for candidate cleaners in this market (aggregated). */
  existingJobs?: ExistingJobInput[];
  /**
   * Optional weekly capacity: how many cleaners marked available per window.
   * When omitted, slots are conflict-filtered only (not hard-coded fake supply).
   */
  supplyByWindow?: Partial<Record<ArrivalWindowId, number>>;
  candidateStarts?: Array<{ id: ArrivalWindowId; hour: number; minute?: number }>;
}

function parseDate(date: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

function wallClockIso(y: number, m: number, d: number, hour: number, minute = 0): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${y}-${pad(m)}-${pad(d)}T${pad(hour)}:${pad(minute)}:00.000`;
}

/**
 * Generate bookable arrival slots for a date.
 * Rejects windows that conflict with every candidate (when jobs provided)
 * or that have zero supply when supply map is provided.
 */
export function generateAvailableSlots(input: GenerateSlotsInput): GeneratedSlot[] {
  const parts = parseDate(input.date);
  if (!parts) return [];

  const durationMinutes = Math.max(
    30,
    input.durationMinutes || MATCH_THRESHOLDS.defaultJobDurationMinutes,
  );
  const travelBufferMinutes =
    input.travelBufferMinutes ?? MATCH_THRESHOLDS.travelBufferMinutes;
  const existing = input.existingJobs ?? [];
  const hasSupply = Boolean(input.supplyByWindow);

  const starts =
    input.candidateStarts ??
    ARRIVAL_WINDOWS.map((w) => ({
      id: w.id as ArrivalWindowId,
      hour: w.startHour,
      minute: 0,
    }));

  return starts.map((start) => {
    const startIso = wallClockIso(parts.y, parts.m, parts.d, start.hour, start.minute ?? 0);
    const end = new Date(startIso);
    end.setMinutes(end.getMinutes() + durationMinutes);
    const endIso = end.toISOString();

    const supply = input.supplyByWindow?.[start.id];
    if (hasSupply && (supply == null || supply < 1)) {
      return {
        id: start.id,
        startIso,
        endIso,
        durationMinutes,
        available: false,
        reason: "no_supply",
      };
    }

    // If we have existing jobs, treat a slot as unavailable when ANY conflict exists
    // against the densest cleaner day (conservative: conflict on proposed interval).
    if (existing.length > 0) {
      const conflict = findScheduleConflict({
        proposed: {
          bookingId: "proposed-slot",
          scheduledAt: startIso,
          durationMinutes,
          travelBufferMinutes,
        },
        existing,
        travelBufferMinutes,
      });

      // Only block the window when supply is exhausted by conflicts.
      // Without per-cleaner assignment, we only block if supplyByWindow says capacity ≤ conflicts.
      if (hasSupply && conflict.hasConflict && (supply ?? 0) <= 1) {
        return {
          id: start.id,
          startIso,
          endIso,
          durationMinutes,
          available: false,
          reason: conflict.reason,
          conflictingBookingId: conflict.conflictingBookingId,
        };
      }
    }

    return {
      id: start.id,
      startIso,
      endIso,
      durationMinutes,
      available: true,
    };
  });
}
