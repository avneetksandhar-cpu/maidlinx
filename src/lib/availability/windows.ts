/**
 * Arrival window suggestions for scheduling UI + future slot generation.
 *
 * Today: sensible market-day windows (morning / afternoon / evening).
 * Later: filter by real cleaner capacity for the market/date.
 */

import { ARRIVAL_WINDOWS, type ArrivalWindowId } from "@/lib/bookings/constants";
import { MATCH_THRESHOLDS } from "@/lib/matching/config";

export interface SuggestedArrivalWindow {
  id: ArrivalWindowId;
  label: string;
  description: string;
  /** Local-ish ISO start for the requested calendar date + window hours. */
  startIso: string;
  endIso: string;
  durationMinutes: number;
  /**
   * When supply is wired: estimated open cleaner capacity in this window.
   * null = unknown (V1 synthetic windows).
   */
  supplyEstimate: number | null;
  /** Whether this window is offered to the customer. */
  available: boolean;
}

export interface SuggestArrivalWindowsInput {
  marketId: string;
  /** Calendar date YYYY-MM-DD (market-local intent). */
  date: string;
  durationMinutes: number;
  /**
   * Optional future hook: precomputed open capacity by window id.
   * When omitted, all standard windows are returned as available.
   */
  supplyByWindow?: Partial<Record<ArrivalWindowId, number>>;
  /** Soft floor — windows below this capacity marked unavailable when supply provided. */
  minSupply?: number;
}

function parseDateParts(date: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

function wallClockIso(y: number, m: number, d: number, hour: number, minute = 0): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${y}-${pad(m)}-${pad(d)}T${pad(hour)}:${pad(minute)}:00.000`;
}

/**
 * Suggest arrival windows for a market/date/duration.
 *
 * Structure is ready for real supply: pass `supplyByWindow` later from
 * cleaner availability aggregation. Without it, returns sensible defaults.
 */
export function suggestArrivalWindows(
  input: SuggestArrivalWindowsInput,
): SuggestedArrivalWindow[] {
  const parts = parseDateParts(input.date);
  if (!parts) return [];

  const durationMinutes = Math.max(
    30,
    input.durationMinutes || MATCH_THRESHOLDS.defaultJobDurationMinutes,
  );
  const minSupply = input.minSupply ?? 1;
  const hasSupply = Boolean(input.supplyByWindow);

  // marketId reserved for timezone / capacity lookups (V2+).
  void input.marketId;

  return ARRIVAL_WINDOWS.map((window) => {
    const supply =
      input.supplyByWindow?.[window.id as ArrivalWindowId] ?? (hasSupply ? 0 : null);
    const available = supply == null ? true : supply >= minSupply;

    return {
      id: window.id,
      label: window.label,
      description: window.description,
      startIso: wallClockIso(parts.y, parts.m, parts.d, window.startHour),
      endIso: wallClockIso(parts.y, parts.m, parts.d, window.endHour),
      durationMinutes,
      supplyEstimate: supply,
      available,
    };
  });
}
