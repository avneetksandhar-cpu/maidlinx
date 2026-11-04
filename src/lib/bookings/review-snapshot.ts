import type { BookingState } from "@/lib/bookings/booking-state";
import { formatCurrency } from "@/lib/utils";
import {
  formatBookingDateShort,
  formatWindowRangeShort,
} from "@/lib/bookings/arrival-labels";
import {
  getBookingServiceLabel,
  BOOKING_EXTRAS,
  type BookingExtraId,
} from "@/lib/bookings/constants";

export const REVIEW_SNAPSHOT_KEY = "maidlinx_review_snapshot";

export type ReviewSnapshot = {
  line1?: string;
  line2?: string;
  serviceType?: string;
  extras?: string[];
  date?: string;
  arrivalWindow?: string;
  totalCents?: number;
  currency?: string;
};

export function captureReviewSnapshot(
  state: BookingState,
  totalCents?: number,
  currency?: string,
): ReviewSnapshot {
  return {
    line1: state.line1,
    line2: state.line2,
    serviceType: state.serviceType,
    extras: [...(state.extras ?? [])].sort(),
    date: state.date,
    arrivalWindow: state.arrivalWindow,
    totalCents,
    currency,
  };
}

export function writeReviewSnapshot(snap: ReviewSnapshot) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(REVIEW_SNAPSHOT_KEY, JSON.stringify(snap));
  } catch {
    /* ignore */
  }
}

export function readReviewSnapshot(): ReviewSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(REVIEW_SNAPSHOT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ReviewSnapshot;
  } catch {
    return null;
  }
}

export function clearReviewSnapshot() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(REVIEW_SNAPSHOT_KEY);
  } catch {
    /* ignore */
  }
}

/** Human-readable list of what changed since last Review view (price/time/extras/unit). */
export function describeReviewChanges(
  prev: ReviewSnapshot | null,
  state: BookingState,
  totalCents?: number,
  currency?: string,
): string[] {
  if (!prev) return [];
  const changes: string[] = [];

  const prevUnit = (prev.line2 ?? "").trim();
  const nextUnit = (state.line2 ?? "").trim();
  if (prevUnit !== nextUnit) {
    changes.push(
      nextUnit
        ? `Unit updated to ${nextUnit}`
        : "Apartment / unit removed",
    );
  }

  if ((prev.line1 ?? "") !== (state.line1 ?? "")) {
    changes.push("Address updated");
  }

  if (prev.serviceType !== state.serviceType) {
    const label = state.serviceType
      ? getBookingServiceLabel(state.serviceType)
      : "service";
    changes.push(`Service changed to ${label}`);
  }

  const prevExtras = [...(prev.extras ?? [])].sort().join(",");
  const nextExtras = [...(state.extras ?? [])].sort().join(",");
  if (prevExtras !== nextExtras) {
    const prevSet = new Set(prev.extras ?? []);
    const nextSet = new Set(state.extras ?? []);
    for (const id of state.extras ?? []) {
      if (!prevSet.has(id)) {
        const extra = BOOKING_EXTRAS.find((e) => e.id === id);
        changes.push(`Added ${extra?.label ?? id}`);
      }
    }
    for (const id of prev.extras ?? []) {
      if (!nextSet.has(id as BookingExtraId)) {
        const extra = BOOKING_EXTRAS.find((e) => e.id === id);
        changes.push(`Removed ${extra?.label ?? id}`);
      }
    }
  }

  if (prev.date !== state.date || prev.arrivalWindow !== state.arrivalWindow) {
    const when = [
      formatBookingDateShort(state.date),
      formatWindowRangeShort(state.arrivalWindow),
    ]
      .filter((x) => x && x !== "—")
      .join(" · ");
    changes.push(when ? `Arrival updated to ${when}` : "Arrival window updated");
  }

  if (
    typeof prev.totalCents === "number" &&
    typeof totalCents === "number" &&
    prev.totalCents !== totalCents
  ) {
    const cur = currency ?? prev.currency ?? "USD";
    changes.push(
      `Total ${prev.totalCents < totalCents ? "increased" : "decreased"} to ${formatCurrency(totalCents, cur)}`,
    );
  }

  return changes;
}
