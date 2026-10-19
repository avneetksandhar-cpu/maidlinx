import { normalizeBookingStatus, type BookingStatus } from "@/lib/bookings/status";

/**
 * Customer-facing timeline (design-spec screen 4):
 * Booked → Cleaner assigned → On the way → Complete
 * Never invents assignment — "Cleaner assigned" only completes when a real Pro is assigned.
 */
export const CUSTOMER_TIMELINE_STEPS = [
  { key: "booked", label: "Booked" },
  { key: "cleaner_assigned", label: "Cleaner assigned" },
  { key: "on_the_way", label: "On the way" },
  { key: "complete", label: "Complete" },
] as const;

/**
 * Live job progress (design-spec screens 8–10):
 * On the way → Arrived → Cleaning → Completed
 */
export const LIVE_JOB_TIMELINE_STEPS = [
  { key: "on_the_way", label: "On the way" },
  { key: "arrived", label: "Arrived" },
  { key: "cleaning", label: "Cleaning" },
  { key: "completed", label: "Completed" },
] as const;

export type CustomerTimelineKey = (typeof CUSTOMER_TIMELINE_STEPS)[number]["key"];
export type LiveJobTimelineKey = (typeof LIVE_JOB_TIMELINE_STEPS)[number]["key"];

function timelineIndexForStatus(status: string): number {
  const normalized = normalizeBookingStatus(status);

  switch (normalized as BookingStatus) {
    case "pending_payment":
    case "draft":
      return 0;
    case "confirmed":
    case "awaiting_assignment":
    case "offered":
      // Booked is complete; Cleaner assigned is current while we find a real Pro.
      return 1;
    case "assigned":
    case "accepted":
      return 1;
    case "on_the_way":
    case "arrived":
    case "in_progress":
      return 2;
    case "completed":
      return 3;
    case "cancelled":
      return -1;
    default:
      return 0;
  }
}

function liveJobIndexForStatus(status: string): number {
  const normalized = normalizeBookingStatus(status);

  switch (normalized as BookingStatus) {
    case "on_the_way":
      return 0;
    case "arrived":
      return 1;
    case "in_progress":
      return 2;
    case "completed":
      return 3;
    default:
      // Pre-en-route statuses: nothing current on the live bar yet.
      return -1;
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

  // When a Pro is already assigned (but not en route), both Booked + Cleaner assigned
  // read as complete checks — matching the design reference (no fake "on the way").
  const assignedWaiting =
    normalized === "assigned" || normalized === "accepted";

  const steps = CUSTOMER_TIMELINE_STEPS.map((step, index) => {
    if (currentIndex < 0) {
      return { key: step.key, label: step.label, state: "upcoming" as const };
    }
    if (index < currentIndex) {
      return { key: step.key, label: step.label, state: "complete" as const };
    }
    if (index === currentIndex) {
      if (assignedWaiting) {
        return { key: step.key, label: step.label, state: "complete" as const };
      }
      return { key: step.key, label: step.label, state: "current" as const };
    }
    return { key: step.key, label: step.label, state: "upcoming" as const };
  });

  return { steps, currentIndex, findingProfessional, showCleaner };
}

/** Live job stepper: On the way → Arrived → Cleaning → Completed. */
export function getLiveJobTimelineState(status: string): {
  steps: Array<{
    key: LiveJobTimelineKey;
    label: string;
    state: "complete" | "current" | "upcoming";
  }>;
  currentIndex: number;
} {
  const currentIndex = liveJobIndexForStatus(status);
  const steps = LIVE_JOB_TIMELINE_STEPS.map((step, index) => ({
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

  return { steps, currentIndex };
}
