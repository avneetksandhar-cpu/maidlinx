import { BOOKING_STATUS_LABELS, BOOKING_STATUSES } from "@/lib/bookings/status";
import { BOOKING_SERVICES } from "@/lib/bookings/constants";
import { formatCurrency } from "@/lib/utils";

export function getServiceLabel(serviceType: string): string {
  return BOOKING_SERVICES.find((s) => s.id === serviceType)?.label ?? serviceType;
}

export function formatBookingDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatBookingTimeRange(
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

export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatAddress(
  line1: string | null,
  city: string | null,
  state: string | null,
): string {
  const parts = [line1, [city, state].filter(Boolean).join(", ")].filter(Boolean);
  return parts.join(" · ") || "Address on file";
}

export function formatBookingTotal(totalCents: number, currency: string): string {
  return formatCurrency(totalCents, currency);
}

export function getStatusLabel(status: string): string {
  return BOOKING_STATUS_LABELS[status as keyof typeof BOOKING_STATUS_LABELS] ?? status;
}

export { BOOKING_STATUSES };

export function canCancelOrReschedule(status: string, scheduledAt: string): boolean {
  const upcoming = [
    "draft",
    "pending_payment",
    "confirmed",
    "awaiting_assignment",
    "offered",
    "assigned",
    "accepted",
    "on_the_way",
    "arrived",
    "in_progress",
  ].includes(status);
  const within24h = new Date(scheduledAt).getTime() - Date.now() < 24 * 60 * 60 * 1000;
  return upcoming && !within24h;
}
