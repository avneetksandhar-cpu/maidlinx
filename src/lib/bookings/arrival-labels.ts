import { ARRIVAL_WINDOWS, type ArrivalWindowId } from "@/lib/bookings/constants";

function formatHourLabel(hour: number): string {
  if (hour === 0) return "midnight";
  if (hour === 12) return "noon";
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12} ${suffix}`;
}

/** Customer-facing window copy: "Arrives noon–4 PM". */
export function formatArrivesWindowLabel(windowId: string | undefined | null): string {
  const meta = ARRIVAL_WINDOWS.find((w) => w.id === windowId);
  if (!meta) return windowId ? `Arrives ${windowId}` : "Arrival window TBD";
  return `Arrives ${formatHourLabel(meta.startHour)}–${formatHourLabel(meta.endHour)}`;
}

export function formatWindowRangeShort(windowId: ArrivalWindowId | string | undefined | null): string {
  const meta = ARRIVAL_WINDOWS.find((w) => w.id === windowId);
  if (!meta) return "—";
  return `${formatHourLabel(meta.startHour)}–${formatHourLabel(meta.endHour)}`;
}

export function formatBookingDateLabel(date: string | undefined | null): string {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return "—";
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y!, m! - 1, d!);
  return dt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
  });
}

export function formatBookingDateShort(date: string | undefined | null): string {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return "—";
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y!, m! - 1, d!);
  return dt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
