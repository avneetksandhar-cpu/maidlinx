import { normalizeBookingStatus, type BookingStatus } from "@/lib/bookings/status";

/**
 * Customer-facing timeline (reference post-booking dashboard):
 * Booked → Confirmed → On the way → Cleaning → Complete
 */
export const CUSTOMER_TIMELINE_STEPS = [
  { key: "booked", label: "Booked" },
  { key: "confirmed", label: "Confirmed" },
  { key: "on_the_way", label: "On the way" },
  { key: "cleaning", label: "Cleaning" },
  { key: "complete", label: "Complete" },
] as const;

export type CustomerTimelineKey = (typeof CUSTOMER_TIMELINE_STEPS)[number]["key"];

function timelineIndexForStatus(status: string): number {
  const normalized = normalizeBookingStatus(status);

  switch (normalized as BookingStatus) {
    case "pending_payment":
    case "draft":
      return 0;
    case "confirmed":
    case "awaiting_assignment":
    case "offered":
    case "assigned":
    case "accepted":
      return 1;
    case "on_the_way":
    case "arrived":
      return 2;
    case "in_progress":
      return 3;
    case "completed":
      return 4;
    case "cancelled":
      return -1;
    default:
      return 1;
  }
}

/** Customer-facing status headline copy derived from backend status. */
export function getCustomerStatusHeadline(status: string): string {
  const normalized = normalizeBookingStatus(status);

  switch (normalized as BookingStatus) {
    case "pending_payment":
      return "Confirming your payment";
    case "confirmed":
    case "awaiting_assignment":
    case "offered":
      return "Finding your MaidLinx Pro…";
    case "assigned":
    case "accepted":
      return "Your Pro is confirmed";
    case "on_the_way":
      return "Your Pro is on the way";
    case "arrived":
      return "Your Pro has arrived";
    case "in_progress":
      return "Cleaning in progress";
    case "completed":
      return "Cleaning complete";
    case "cancelled":
      return "Booking cancelled";
    default:
      return "Booking update";
  }
}

export function getCustomerTimelineState(status: string): {
  steps: Array<{
    key: CustomerTimelineKey;
    label: string;
    state: "complete" | "current" | "upcoming";
  }>;
  currentIndex: number;
  findingProfessional: boolean;
  showCleaner: boolean;
} {
  const currentIndex = timelineIndexForStatus(status);
  const normalized = normalizeBookingStatus(status);
  const findingProfessional =
    normalized === "confirmed" ||
    normalized === "awaiting_assignment" ||
    normalized === "offered";
  const showCleaner =
    currentIndex >= 1 &&
    ["assigned", "accepted", "on_the_way", "arrived", "in_progress", "completed"].includes(
      String(normalized),
    );

  const steps = CUSTOMER_TIMELINE_STEPS.map((step, index) => ({
    key: step.key,
    label: step.label,
    state:
      currentIndex < 0
        ? ("upcoming" as const)
        : index < currentIndex
          ? ("complete" as const)
          : index === currentIndex
            ? ("current" as const)
            : ("upcoming" as const),
  }));

  return { steps, currentIndex, findingProfessional, showCleaner };
}
