import { formatCurrency } from "@/lib/utils";
import { BOOKING_SERVICES } from "@/lib/bookings/constants";

export function formatAdminCurrency(cents: number, currency = "USD"): string {
  return formatCurrency(cents, currency);
}

export function getServiceLabel(type: string): string {
  return BOOKING_SERVICES.find((s) => s.id === type)?.label ?? type;
}

export function formatAdminDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatStatusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
