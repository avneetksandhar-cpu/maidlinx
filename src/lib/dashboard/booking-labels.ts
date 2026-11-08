import type { DashboardBooking } from "@/lib/dashboard/bookings";
import { getServiceLabel } from "@/lib/dashboard/display";
import { BOOKING_STATUS_LABELS, normalizeBookingStatus } from "@/lib/bookings/status";
import type { SavedAddress } from "@/lib/addresses/types";

/** Resolve a customer-facing property label from saved places or street address. */
export function resolvePropertyLabel(
  booking: Pick<DashboardBooking, "addressLine1" | "addressCity" | "addressId" | "propertyType">,
  sites: SavedAddress[] = [],
): string {
  if (booking.addressId) {
    const byId = sites.find((s) => s.id === booking.addressId);
    if (byId?.label?.trim()) return byId.label.trim();
  }

  const line = (booking.addressLine1 ?? "").trim().toLowerCase();
  if (line) {
    const byLine = sites.find((s) => s.addressLine1.trim().toLowerCase() === line);
    if (byLine?.label?.trim()) return byLine.label.trim();
  }

  if (booking.addressLine1?.trim()) return booking.addressLine1.trim();
  return "Property";
}

export function formatFullAddress(
  booking: Pick<
    DashboardBooking,
    "addressLine1" | "addressLine2" | "addressCity" | "addressState" | "addressPostalCode"
  >,
): string {
  const street = [booking.addressLine1, booking.addressLine2].filter(Boolean).join(", ");
  const cityState = [booking.addressCity, booking.addressState].filter(Boolean).join(", ");
  return [street, cityState, booking.addressPostalCode].filter(Boolean).join(", ") || "Address on file";
}

/** Status pill copy — real status only; never invent Confirmed when awaiting. */
export function bookingStatusPillLabel(status: string): string {
  const normalized = String(normalizeBookingStatus(status));
  if (normalized === "accepted" || normalized === "assigned") return "Confirmed";
  if (normalized === "awaiting_assignment" || normalized === "offered" || normalized === "confirmed") {
    return BOOKING_STATUS_LABELS[normalized as keyof typeof BOOKING_STATUS_LABELS] ?? normalized;
  }
  return (
    BOOKING_STATUS_LABELS[normalized as keyof typeof BOOKING_STATUS_LABELS] ??
    normalized.replaceAll("_", " ")
  );
}

export function isPositiveStatus(status: string): boolean {
  const normalized = String(normalizeBookingStatus(status));
  return [
    "confirmed",
    "awaiting_assignment",
    "offered",
    "assigned",
    "accepted",
    "on_the_way",
    "arrived",
    "in_progress",
    "completed",
  ].includes(normalized);
}

export function serviceLabelForBooking(booking: Pick<DashboardBooking, "serviceType">): string {
  return getServiceLabel(booking.serviceType);
}

/** Section heading for later visits — "Later this month" / "Later" by calendar month. */
export function laterSectionTitle(scheduledAt: string, now = new Date()): string {
  const d = new Date(scheduledAt);
  if (Number.isNaN(d.getTime())) return "Later";
  if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
    return "Later this month";
  }
  return "Later";
}

export function isRecurringBooking(booking: Pick<DashboardBooking, "recurringPreference">): boolean {
  const pref = booking.recurringPreference?.trim().toLowerCase();
  return Boolean(pref && pref !== "one_time" && pref !== "once");
}

export function buildRebookHref(booking: DashboardBooking): string {
  const params = new URLSearchParams({ rebook: "1", sourceBookingId: booking.id });
  if (booking.serviceType) params.set("serviceType", booking.serviceType);
  if (booking.addressLine1) params.set("line1", booking.addressLine1);
  if (booking.addressLine2) params.set("line2", booking.addressLine2);
  if (booking.addressCity) params.set("city", booking.addressCity);
  if (booking.addressState) params.set("state", booking.addressState);
  if (booking.addressPostalCode) params.set("postalCode", booking.addressPostalCode);
  if (booking.addressCountry) params.set("country", booking.addressCountry);
  if (booking.propertyType) params.set("propertyType", booking.propertyType);
  if (booking.bedrooms != null) params.set("bedrooms", String(booking.bedrooms));
  if (booking.bathrooms != null) params.set("bathrooms", String(booking.bathrooms));
  if (booking.squareFootage != null) params.set("squareFootage", String(booking.squareFootage));
  if (booking.extras.length > 0) params.set("extras", booking.extras.join(","));
  if (booking.professionalProfileId) {
    params.set("preferredCleanerId", booking.professionalProfileId);
  }
  if (booking.professionalName) {
    params.set("preferredCleanerName", booking.professionalName);
  }
  // Jump to date so customer only picks new schedule after property+service prefill.
  return `/book/date?${params.toString()}`;
}
