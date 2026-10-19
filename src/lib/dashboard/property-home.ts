import type { SavedAddress } from "@/lib/addresses/types";
import type { DashboardBooking } from "@/lib/dashboard/bookings";
import { getServiceLabel } from "@/lib/dashboard/display";
import { routes } from "@/config/site";

export type PropertyHomeRow = {
  key: string;
  label: string;
  addressLine: string;
  /** Next upcoming clean for this property, if any. */
  nextClean: {
    bookingId: string;
    serviceLabel: string;
    scheduledAt: string;
    datePill: string;
  } | null;
  /** Prefill URL into the real booking funnel (no invented availability). */
  scheduleHref: string;
};

/** Relative date pill — Today / Tomorrow / Fri, Apr 25. */
export function formatCleanDatePill(iso: string, now = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const day = startOfDay(d);
  const today = startOfDay(now);
  const tomorrow = today + 24 * 60 * 60 * 1000;

  if (day === today) return "Today";
  if (day === tomorrow) return "Tomorrow";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(d);
}

function normalizeKey(line1: string, city: string, postal: string): string {
  return [line1, city, postal]
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean)
    .join("|");
}

function bookingMatchesAddress(
  booking: DashboardBooking,
  address: Pick<SavedAddress, "addressLine1" | "city" | "postalCode">,
): boolean {
  const bKey = normalizeKey(
    booking.addressLine1 ?? "",
    booking.addressCity ?? "",
    booking.addressPostalCode ?? "",
  );
  const aKey = normalizeKey(address.addressLine1, address.city, address.postalCode);
  if (!bKey || !aKey) return false;
  return bKey === aKey;
}

export function buildScheduleHrefFromAddress(address: {
  addressLine1: string;
  unit?: string | null;
  city: string;
  region: string;
  postalCode: string;
  country?: string | null;
}): string {
  const params = new URLSearchParams();
  params.set("line1", address.addressLine1);
  if (address.unit) params.set("line2", address.unit);
  params.set("city", address.city);
  params.set("state", address.region);
  params.set("postalCode", address.postalCode);
  if (address.country) params.set("country", address.country);
  // Land on category after address prefill (draft hydrates from query).
  return `${routes.bookProperty}?${params.toString()}`;
}

function findNextClean(
  bookings: DashboardBooking[],
  address: Pick<SavedAddress, "addressLine1" | "city" | "postalCode">,
): PropertyHomeRow["nextClean"] {
  const match = bookings.find((b) => bookingMatchesAddress(b, address));
  if (!match) return null;
  return {
    bookingId: match.id,
    serviceLabel: getServiceLabel(match.serviceType),
    scheduledAt: match.scheduledAt,
    datePill: formatCleanDatePill(match.scheduledAt),
  };
}

/**
 * Build property rows for the customer Home screen from real saved places + upcoming bookings.
 * When there are no saved places, fall back to unique addresses from upcoming bookings.
 */
export function buildPropertyHomeRows(
  properties: SavedAddress[],
  upcoming: DashboardBooking[],
): PropertyHomeRow[] {
  if (properties.length > 0) {
    return properties.map((p) => {
      const nextClean = findNextClean(upcoming, p);
      return {
        key: p.id,
        label: p.label || p.addressLine1,
        addressLine: [p.addressLine1, p.city].filter(Boolean).join(", "),
        nextClean,
        scheduleHref: buildScheduleHrefFromAddress(p),
      };
    });
  }

  // Derive rows from upcoming booking addresses (no invented properties).
  const seen = new Set<string>();
  const rows: PropertyHomeRow[] = [];
  for (const b of upcoming) {
    const key = normalizeKey(
      b.addressLine1 ?? "",
      b.addressCity ?? "",
      b.addressPostalCode ?? "",
    );
    if (!key || seen.has(key)) continue;
    seen.add(key);
    rows.push({
      key: b.id,
      label: b.addressLine1 || "Property",
      addressLine: [b.addressLine1, b.addressCity].filter(Boolean).join(", "),
      nextClean: {
        bookingId: b.id,
        serviceLabel: getServiceLabel(b.serviceType),
        scheduledAt: b.scheduledAt,
        datePill: formatCleanDatePill(b.scheduledAt),
      },
      scheduleHref: buildScheduleHrefFromAddress({
        addressLine1: b.addressLine1 ?? "",
        unit: b.addressLine2,
        city: b.addressCity ?? "",
        region: b.addressState ?? "",
        postalCode: b.addressPostalCode ?? "",
        country: b.addressCountry,
      }),
    });
  }
  return rows;
}
