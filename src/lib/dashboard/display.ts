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
  const fmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
  if (start && end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())) {
      return `${fmt.format(startDate)} – ${fmt.format(endDate)}`;
    }
  }

  const scheduled = new Date(scheduledAt);
  if (!Number.isNaN(scheduled.getTime())) {
    return fmt.format(scheduled);
  }
  return "Time TBD";
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
