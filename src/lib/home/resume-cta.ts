import {
  BOOKING_SCREEN_PATHS,
  getFurthestScreenPath,
} from "@/lib/bookings/booking-routes";
import type { BookingState } from "@/lib/bookings/booking-state";
import { normalizeBookingStatus } from "@/lib/bookings/status";
import type { DashboardBooking } from "@/lib/dashboard/bookings";

/**
 * Founder Home — one primary tap by customer state.
 * Priority (highest urgency first):
 *   on_the_way → upcoming → finish_booking → usual
 */
export type HomeResumeKind =
  | "on_the_way"
  | "upcoming"
  | "finish_booking"
  | "usual";

export interface HomeResumeCta {
  kind: HomeResumeKind;
  /** Eyebrow / status line above the action. */
  label: string;
  /** Primary button / link copy. */
  cta: string;
  href: string;
  bookingId?: string;
}

export function isCleanerOnTheWay(status: string): boolean {
  const n = normalizeBookingStatus(status);
  return n === "on_the_way" || n === "arrived" || n === "in_progress";
}

export function isLiveUpcoming(status: string): boolean {
  const n = normalizeBookingStatus(status);
  return (
    n === "confirmed" ||
    n === "awaiting_assignment" ||
    n === "offered" ||
    n === "assigned" ||
    n === "accepted" ||
    isCleanerOnTheWay(n)
  );
}

/** Abandoned draft with real selections — clean not booked yet (session draft). */
export function hasMidBookingDraft(state: BookingState): boolean {
  return Boolean(state.line1?.trim() || state.serviceType || state.propertyType);
}

export function finishBookingHref(state: BookingState): string {
  const path = getFurthestScreenPath(state) || BOOKING_SCREEN_PATHS.address;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}finish=1`;
}

export function usualNewTimeHref(): string {
  return `${BOOKING_SCREEN_PATHS.date}?usual=1`;
}

export function resolveHomeResumeCta(input: {
  upcoming: DashboardBooking | null;
  draft: BookingState;
  hasUsualClean: boolean;
}): HomeResumeCta | null {
  const { upcoming, draft, hasUsualClean } = input;

  const bookingHref =
    upcoming && (upcoming.isCommercial || upcoming.serviceOrderId)
      ? `/dashboard/book/status/${upcoming.id}`
      : upcoming
        ? `/bookings/${upcoming.id}`
        : "";

  if (upcoming && isCleanerOnTheWay(upcoming.status)) {
    return {
      kind: "on_the_way",
      label: "Cleaner on the way",
      cta: "View arrival",
      href: bookingHref,
      bookingId: upcoming.id,
    };
  }

  if (upcoming && isLiveUpcoming(upcoming.status)) {
    return {
      kind: "upcoming",
      label: "Upcoming clean",
      cta: "View my clean",
      href: bookingHref,
      bookingId: upcoming.id,
    };
  }

  if (hasMidBookingDraft(draft)) {
    return {
      kind: "finish_booking",
      label: "Finish your booking",
      cta: "Continue booking",
      href: finishBookingHref(draft),
    };
  }

  if (hasUsualClean) {
    return {
      kind: "usual",
      label: "Your usual clean",
      cta: "Choose a new time",
      href: usualNewTimeHref(),
    };
  }

  return null;
}
