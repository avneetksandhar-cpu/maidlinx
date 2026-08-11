import {
  normalizeBookingStatus,
  validateBookingStatusTransition,
  type BookingStatus,
} from "@/lib/bookings/status";

/** Cleaner-facing job lifecycle after accept (maps to DB booking_status enum). */
export const CLEANER_STATUS_FLOW = [
  "accepted",
  "on_the_way",
  "arrived",
  "in_progress",
  "completed",
] as const;

export type CleanerJobStatus = (typeof CLEANER_STATUS_FLOW)[number];

const ALLOWED_TRANSITIONS: Partial<Record<BookingStatus, BookingStatus[]>> = {
  awaiting_assignment: ["accepted"],
  offered: ["accepted"],
  assigned: ["accepted", "on_the_way"],
  accepted: ["on_the_way"],
  on_the_way: ["arrived"],
  arrived: ["in_progress"],
  in_progress: ["completed"],
};

export type CleanerJobAction = "accept" | "onTheWay" | "arrived" | "start" | "complete";

export const ACTION_TO_STATUS: Record<CleanerJobAction, BookingStatus> = {
  accept: "accepted",
  onTheWay: "on_the_way",
  arrived: "arrived",
  start: "in_progress",
  complete: "completed",
};

const STATUS_TO_ACTION: Partial<Record<BookingStatus, CleanerJobAction>> = {
  on_the_way: "onTheWay",
  arrived: "arrived",
  in_progress: "start",
  completed: "complete",
};

export function validateCleanerStatusTransition(
  fromStatus: string,
  toStatus: string,
): { valid: true } | { valid: false; error: string } {
  const from = normalizeBookingStatus(fromStatus) as BookingStatus;
  const to = normalizeBookingStatus(toStatus) as BookingStatus;

  const allowed = ALLOWED_TRANSITIONS[from];
  if (allowed?.includes(to)) {
    return { valid: true };
  }

  return validateBookingStatusTransition(from, to);
}

export function getNextCleanerStatus(current: string): CleanerJobStatus | null {
  const normalized = normalizeBookingStatus(current);

  if (normalized === "awaiting_assignment" || normalized === "offered") {
    return "accepted";
  }

  // Admin-assigned jobs can proceed directly on the way.
  if (normalized === "assigned") {
    return "on_the_way";
  }

  const index = CLEANER_STATUS_FLOW.indexOf(normalized as CleanerJobStatus);
  if (index === -1 || index >= CLEANER_STATUS_FLOW.length - 1) {
    return null;
  }
  const next = CLEANER_STATUS_FLOW[index + 1];
  if (next === undefined) return null;
  return next;
}

export function getActionForNextStatus(current: string): CleanerJobAction | null {
  const normalized = normalizeBookingStatus(current);
  if (normalized === "awaiting_assignment" || normalized === "offered") {
    return "accept";
  }

  const next = getNextCleanerStatus(normalized);
  if (!next) return null;
  if (next === "accepted") return "accept";
  return STATUS_TO_ACTION[next] ?? null;
}

export function getActionLabel(action: CleanerJobAction): string {
  switch (action) {
    case "accept":
      return "Accept job";
    case "onTheWay":
      return "On my way";
    case "arrived":
      return "Arrived";
    case "start":
      return "Start cleaning";
    case "complete":
      return "Complete";
    default:
      return action;
  }
}

export function isCleanerActiveStatus(status: string): boolean {
  const normalized = normalizeBookingStatus(status);
  return (
    ((CLEANER_STATUS_FLOW as readonly string[]).includes(normalized) &&
      normalized !== "completed") ||
    normalized === "assigned"
  );
}
