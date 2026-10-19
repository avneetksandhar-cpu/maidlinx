import { addCalendarDays, miamiCalendarDate, wallTimeInZoneToUtc } from "@/lib/events/timezone";
import type { WhenChoice } from "@/lib/booking-flow/types";

export function dateForWhen(when: WhenChoice, picked: string | null, now = new Date()): string {
  if (when === "tomorrow") return addCalendarDays(miamiCalendarDate(now), 1);
  if (when === "date" && picked) return picked;
  return miamiCalendarDate(now);
}

export function startsAtIso(date: string, timeText = "11:00 PM"): string {
  const match = timeText.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  let hour = 23;
  let minute = 0;
  if (match) {
    hour = Number(match[1]);
    minute = Number(match[2]);
    const mer = match[3]?.toUpperCase();
    if (mer === "PM" && hour < 12) hour += 12;
    if (mer === "AM" && hour === 12) hour = 0;
  }
  return wallTimeInZoneToUtc(date, hour, minute).toISOString();
}

export function formatShortDate(date: string) {
  const today = miamiCalendarDate();
  const tomorrow = addCalendarDays(today, 1);
  if (date === today) return "Tonight";
  if (date === tomorrow) return "Tomorrow";
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatNightLabel(date: string, timeText: string) {
  const when = formatShortDate(date);
  return timeText ? `${when} · ${timeText}` : when;
}
