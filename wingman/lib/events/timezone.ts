import { MIAMI_TIMEZONE } from "@/lib/events/types";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function getTimeZoneOffsetMs(utcMs: number, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date(utcMs)).map((part) => [part.type, part.value]),
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - utcMs;
}

/** Convert a Miami wall-clock time to UTC, honoring America/New_York DST. */
export function wallTimeInZoneToUtc(
  localDate: string,
  hour: number,
  minute: number,
  timeZone = MIAMI_TIMEZONE,
): Date {
  const iso = `${localDate}T${pad(hour)}:${pad(minute)}:00`;
  const asUtc = Date.parse(`${iso}Z`);
  const firstOffset = getTimeZoneOffsetMs(asUtc, timeZone);
  let utcMs = asUtc - firstOffset;
  const secondOffset = getTimeZoneOffsetMs(utcMs, timeZone);
  if (secondOffset !== firstOffset) {
    utcMs = asUtc - secondOffset;
  }
  return new Date(utcMs);
}

export function formatInTimeZone(
  date: Date,
  timeZone = MIAMI_TIMEZONE,
): { date: string; hour: number; minute: number; timeText: string } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  const hour = Number(parts.hour);
  const minute = Number(parts.minute);
  const mer = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour,
    minute,
    timeText: `${hour12}:${pad(minute)} ${mer}`,
  };
}

export function miamiCalendarDate(now = new Date(), timeZone = MIAMI_TIMEZONE): string {
  return formatInTimeZone(now, timeZone).date;
}

/** Normalize pg DATE / Date / ISO text to YYYY-MM-DD without weekday strings. */
export function toIsoDate(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const raw = String(value ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  throw new Error(`invalid input syntax for type date: "${raw}"`);
}

export function addCalendarDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return utc.toISOString().slice(0, 10);
}

export function weekdayInZone(isoDate: string, timeZone = MIAMI_TIMEZONE): number {
  const noon = wallTimeInZoneToUtc(isoDate, 12, 0, timeZone);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(noon);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
}

/** Friday–Sunday of the current or upcoming weekend in the event timezone. */
export function weekendRange(
  now = new Date(),
  timeZone = MIAMI_TIMEZONE,
): { start: string; end: string } {
  const today = miamiCalendarDate(now, timeZone);
  const weekday = weekdayInZone(today, timeZone);
  const daysToFriday = weekday === 0 ? -2 : weekday === 6 ? -1 : 5 - weekday;
  const friday = addCalendarDays(today, daysToFriday);
  return { start: friday, end: addCalendarDays(friday, 2) };
}

export function parseClock(raw: string): { hour: number; minute: number; text: string } {
  const text = raw.trim();
  const match = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return { hour: 23, minute: 0, text: text || "11:00 PM" };
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const mer = match[3]?.toUpperCase();
  if (mer === "PM" && hour < 12) hour += 12;
  if (mer === "AM" && hour === 12) hour = 0;
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const displayMer = hour >= 12 ? "PM" : "AM";
  return {
    hour,
    minute,
    text: mer || text.toLowerCase().includes("am") || text.toLowerCase().includes("pm")
      ? `${hour12}:${pad(minute)} ${displayMer}`
      : text,
  };
}
