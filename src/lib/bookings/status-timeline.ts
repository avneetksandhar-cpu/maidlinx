import { normalizeBookingStatus, type BookingStatus } from "@/lib/bookings/status";

/** Customer-facing timeline milestones derived from real booking status. */
export const CUSTOMER_TIMELINE_STEPS = [
  { key: "confirmed", label: "Confirmed" },
  { key: "assigned", label: "Cleaner Assigned" },
  { key: "on_the_way", label: "On the Way" },
  { key: "arrived", label: "Arrived" },
  { key: "in_progress", label: "Cleaning" },
  { key: "completed", label: "Completed" },
] as const;

export type CustomerTimelineKey = (typeof CUSTOMER_TIMELINE_STEPS)[number]["key"];

function timelineIndexForStatus(status: string): number {
  const normalized = normalizeBookingStatus(status);

  switch (normalized as BookingStatus) {
    case "pending_payment":
      return -1;
    case "confirmed":
    case "awaiting_assignment":
    case "offered":
      return 0;
    case "assigned":
    case "accepted":
      return 1;
    case "on_the_way":
      return 2;
    case "arrived":
      return 3;
    case "in_progress":
      return 4;
    case "completed":
      return 5;
    case "cancelled":
      return -1;
    default:
      return 0;
  }
}

export function getCustomerTimelineState(status: string): {
  steps: Array<{ key: CustomerTimelineKey; label: string; state: "complete" | "current" | "upcoming" }>;
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
