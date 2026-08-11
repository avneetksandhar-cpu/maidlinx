export const BOOKING_STATUSES = [
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
  "completed",
  "cancelled",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** Legacy status strings → canonical marketplace status. */
const LEGACY_STATUS_MAP: Record<string, BookingStatus> = {
  awaiting_cleaner: "awaiting_assignment",
  cleaner_on_way: "on_the_way",
  cleaner_arrived: "arrived",
  pending: "pending_payment",
  refunded: "cancelled",
};

export function normalizeBookingStatus(status: string): BookingStatus | string {
  if ((BOOKING_STATUSES as readonly string[]).includes(status)) {
    return status as BookingStatus;
  }
  return LEGACY_STATUS_MAP[status] ?? status;
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  draft: "Draft",
  pending_payment: "Pending payment",
  confirmed: "Confirmed",
  awaiting_assignment: "Awaiting assignment",
  offered: "Offered",
  assigned: "Assigned",
  accepted: "Accepted",
  on_the_way: "On the way",
  arrived: "Arrived",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Statuses shown to customers as upcoming/active bookings. */
export const UPCOMING_BOOKING_STATUSES: BookingStatus[] = [
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
];

/** Terminal / historical statuses. */
export const PAST_BOOKING_STATUSES: BookingStatus[] = ["completed", "cancelled"];

/** Statuses where a cleaner has accepted or been assigned the job. */
export const ACTIVE_JOB_STATUSES: BookingStatus[] = [
  "assigned",
  "accepted",
  "on_the_way",
  "arrived",
  "in_progress",
];

/** Jobs visible in the cleaner marketplace (unassigned, paid). */
export const AVAILABLE_JOB_STATUSES: BookingStatus[] = ["awaiting_assignment", "offered"];

/** Paid / post-checkout booking statuses. */
export const PAID_BOOKING_STATUSES: BookingStatus[] = [
  "confirmed",
  "awaiting_assignment",
  "offered",
  "assigned",
  "accepted",
  "on_the_way",
  "arrived",
  "in_progress",
  "completed",
];

/** Server-side allowed transitions (marketplace lifecycle). */
export const BOOKING_STATUS_TRANSITIONS: Partial<Record<BookingStatus, BookingStatus[]>> = {
  draft: ["pending_payment", "cancelled"],
  pending_payment: ["confirmed", "awaiting_assignment", "cancelled"],
  confirmed: ["awaiting_assignment", "cancelled"],
  awaiting_assignment: ["offered", "assigned", "accepted", "cancelled"],
  offered: ["assigned", "accepted", "awaiting_assignment", "cancelled"],
  assigned: ["accepted", "on_the_way", "cancelled"],
  accepted: ["on_the_way", "cancelled"],
  on_the_way: ["arrived", "cancelled"],
  arrived: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function validateBookingStatusTransition(
  fromStatus: string,
  toStatus: string,
): { valid: true } | { valid: false; error: string } {
  const from = normalizeBookingStatus(fromStatus) as BookingStatus;
  const to = normalizeBookingStatus(toStatus) as BookingStatus;
  const allowed = BOOKING_STATUS_TRANSITIONS[from];
  if (!allowed?.includes(to)) {
    return {
      valid: false,
      error: `Invalid status transition from "${fromStatus}" to "${toStatus}".`,
    };
  }
  return { valid: true };
}

export function getBookingStatusLabel(status: string): string {
  const normalized = normalizeBookingStatus(status);
  return BOOKING_STATUS_LABELS[normalized as BookingStatus] ?? status;
}

export function isPaidBookingStatus(status: string): boolean {
  const normalized = normalizeBookingStatus(status);
  return (PAID_BOOKING_STATUSES as readonly string[]).includes(normalized);
}
