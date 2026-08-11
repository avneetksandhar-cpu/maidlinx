import { BOOKING_STATUS_LABELS } from "@/lib/bookings/status";
import { BOOKING_SERVICES } from "@/lib/bookings/constants";
import { getServiceByLegacyType, getServiceById } from "@/config/services";
import { formatCurrency } from "@/lib/utils";

export function getServiceLabel(serviceType: string): string {
  const marketplace =
    getServiceByLegacyType(serviceType) ?? getServiceById(serviceType);
  if (marketplace) return marketplace.name;
  return BOOKING_SERVICES.find((s) => s.id === serviceType)?.label ?? serviceType;
}

export function formatJobDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

export function formatJobTimeRange(
  scheduledAt: string,
  start: string | null,
  end: string | null,
): string {
  if (start && end) {
    const fmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
    return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(scheduledAt));
}

export function formatAddress(
  line1: string | null,
  line2: string | null,
  city: string | null,
  state: string | null,
  postalCode: string | null,
): string {
  const street = [line1, line2].filter(Boolean).join(", ");
  const locality = [city, state, postalCode].filter(Boolean).join(", ");
  return [street, locality].filter(Boolean).join(" · ") || "Address on file";
}

export function formatGeneralLocation(
  city: string | null,
  state: string | null,
  postalCode: string | null,
): string {
  const locality = [city, state].filter(Boolean).join(", ");
  const postal = postalCode?.trim() ? postalCode.trim() : null;
  return [locality, postal].filter(Boolean).join(" · ") || "Location available after accept";
}

export function formatTravelEstimate(
  distanceKm: number | null,
  travelMinutes: number | null,
): string | null {
  if (distanceKm == null && travelMinutes == null) return null;
  const parts: string[] = [];
  if (distanceKm != null) parts.push(`${distanceKm} km`);
  if (travelMinutes != null) parts.push(`~${travelMinutes} min travel`);
  return parts.join(" · ");
}

export function formatEarnings(cents: number, currency = "USD"): string {
  return formatCurrency(cents, currency);
}

export function getDirectionsUrl(
  line1: string | null,
  city: string | null,
  state: string | null,
  postalCode: string | null,
  lat: number | null,
  lng: number | null,
): string {
  if (lat && lng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }

  const query = encodeURIComponent(
    [line1, city, state, postalCode].filter(Boolean).join(", "),
  );
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}

export function getJobStatusLabel(status: string): string {
  return BOOKING_STATUS_LABELS[status as keyof typeof BOOKING_STATUS_LABELS] ?? status;
}

export function isToday(iso: string): boolean {
  const date = new Date(iso);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
