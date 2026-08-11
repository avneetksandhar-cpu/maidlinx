import type { ArrivalWindowId } from "@/lib/bookings/constants";
import type { SchedulePreset } from "@/lib/bookings/booking-state";

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function defaultWindowForNow(now = new Date()): ArrivalWindowId {
  const hour = now.getHours();
  if (hour < 11) return "morning";
  if (hour < 15) return "afternoon";
  return "evening";
}

/**
 * Resolve ASAP / Today / Tomorrow into a concrete date + arrival window.
 * Architecture leaves room for real availability later — this is preference only.
 */
export function resolveSchedulePreset(
  preset: SchedulePreset,
  options?: { date?: string; arrivalWindow?: ArrivalWindowId },
): { date: string; arrivalWindow: ArrivalWindowId } {
  const now = new Date();

  if (preset === "asap") {
    return {
      date: toDateString(now),
      arrivalWindow: defaultWindowForNow(now),
    };
  }

  if (preset === "today") {
    return {
      date: toDateString(now),
      arrivalWindow: options?.arrivalWindow ?? defaultWindowForNow(now),
    };
  }

  if (preset === "tomorrow") {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      date: toDateString(tomorrow),
      arrivalWindow: options?.arrivalWindow ?? "morning",
    };
  }

  // Explicit date pick
  const fallback = new Date(now);
  fallback.setDate(fallback.getDate() + 1);
  return {
    date: options?.date || toDateString(fallback),
    arrivalWindow: options?.arrivalWindow ?? "morning",
  };
}

export function formatDurationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `~${hours} hr`;
  return `~${hours} hr ${mins} min`;
}
