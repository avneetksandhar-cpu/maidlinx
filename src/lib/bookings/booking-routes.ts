import type { BookingState } from "@/lib/bookings/booking-state";
import { isQuoteOnlyService } from "@/config/services";

/**
 * Multi-screen booking funnel — aligned to Uber-like design reference:
 * Welcome → Category → Service → Property/Address → Details → …
 * Paths are App Router destinations under /book/*.
 */
export const BOOKING_SCREENS = [
  { id: "welcome", path: "/book/welcome", label: "Welcome", shortLabel: "Start" },
  { id: "property", path: "/book/property", label: "Category", shortLabel: "What" },
  { id: "service", path: "/book/service", label: "Service", shortLabel: "Clean" },
  { id: "address", path: "/book/address", label: "Property", shortLabel: "Where" },
  { id: "details", path: "/book/details", label: "Details", shortLabel: "Details" },
  { id: "addons", path: "/book/addons", label: "Add-ons", shortLabel: "Extras" },
  { id: "date", path: "/book/date", label: "Date", shortLabel: "Date" },
  { id: "time", path: "/book/time", label: "Time", shortLabel: "Time" },
  { id: "access", path: "/book/access", label: "Access", shortLabel: "Access" },
  { id: "review", path: "/book/review", label: "Review", shortLabel: "Review" },
  { id: "payment", path: "/book/payment", label: "Payment", shortLabel: "Pay" },
] as const;

export type BookingScreenId = (typeof BOOKING_SCREENS)[number]["id"];

export const BOOKING_SCREEN_PATHS = Object.fromEntries(
  BOOKING_SCREENS.map((s) => [s.id, s.path]),
) as Record<BookingScreenId, string>;

/** Legacy path aliases kept for bookmarks / older links. */
export const BOOKING_LEGACY_REDIRECTS: Record<string, BookingScreenId> = {
  "/book/extras": "addons",
  "/book/schedule": "date",
};

export function getBookingScreen(id: BookingScreenId) {
  return BOOKING_SCREENS.find((s) => s.id === id)!;
}

export function getBookingScreenIndex(id: BookingScreenId): number {
  return BOOKING_SCREENS.findIndex((s) => s.id === id);
}

export function bookingPath(id: BookingScreenId, query?: Record<string, string>): string {
  const base = BOOKING_SCREEN_PATHS[id];
  if (!query || Object.keys(query).length === 0) return base;
  const params = new URLSearchParams(query);
  return `${base}?${params.toString()}`;
}

export function bookingStatusPath(id: string, token?: string | null): string {
  const q = token ? `?token=${encodeURIComponent(token)}` : "";
  return `/bookings/${id}${q}`;
}

export function isAddressComplete(state: BookingState): boolean {
  return Boolean(
    state.line1?.trim() &&
      state.city?.trim() &&
      state.state?.trim() &&
      state.postalCode?.trim() &&
      state.country?.trim() &&
      state.marketId &&
      state.inServiceArea !== false,
  );
}

export function isPropertyComplete(state: BookingState): boolean {
  return Boolean(state.propertyType);
}

export function isDetailsComplete(state: BookingState): boolean {
  if (!state.propertyType) return false;
  if (state.squareFootage == null || state.squareFootage < 200) return false;
  if (state.bathrooms == null || state.bathrooms < 1) return false;

  const commercial =
    state.propertyType === "office" ||
    state.propertyType === "retail" ||
    state.propertyType === "restaurant" ||
    state.propertyType === "commercial" ||
    state.propertyType === "post_construction";

  if (!commercial && (state.bedrooms == null || state.bedrooms < 0)) return false;

  if (state.propertyType === "move") {
    const direction = state.serviceAnswers?.moveDirection;
    if (direction !== "move_in" && direction !== "move_out") return false;
  }

  if (state.propertyType === "other") {
    const notes = String(state.serviceAnswers?.otherNotes ?? state.notes ?? "").trim();
    if (!notes) return false;
  }

  return true;
}

export function isServiceComplete(state: BookingState): boolean {
  return Boolean(state.serviceType && (state.serviceTierId || state.serviceType));
}

export function isExtrasComplete(state: BookingState): boolean {
  if (state.serviceType && isQuoteOnlyService(state.serviceType)) return true;
  return Array.isArray(state.extras);
}

/** Date step: preset + concrete YYYY-MM-DD. */
export function isDateComplete(state: BookingState): boolean {
  return Boolean(
    state.schedulePreset && state.date && /^\d{4}-\d{2}-\d{2}$/.test(state.date),
  );
}

/** Time step: arrival window (ASAP resolves one automatically). */
export function isTimeComplete(state: BookingState): boolean {
  return Boolean(state.arrivalWindow);
}

/** Access notes are optional — step is always completable. */
export function isAccessComplete(): boolean {
  return true;
}

export function isScheduleComplete(state: BookingState): boolean {
  return isDateComplete(state) && isTimeComplete(state);
}

export function isReviewReady(state: BookingState): boolean {
  return (
    isPropertyComplete(state) &&
    isServiceComplete(state) &&
    isAddressComplete(state) &&
    isDetailsComplete(state) &&
    isExtrasComplete(state) &&
    isScheduleComplete(state)
  );
}

/**
 * Guard: prerequisites that must be true before entering a screen.
 * Welcome has no prerequisites. Category (property) is first real decision.
 */
const COMPLETION: Record<BookingScreenId, (state: BookingState) => boolean> = {
  welcome: () => true,
  property: () => true,
  service: isPropertyComplete,
  address: (s) => isPropertyComplete(s) && isServiceComplete(s),
  details: (s) => isPropertyComplete(s) && isServiceComplete(s) && isAddressComplete(s),
  addons: (s) =>
    isPropertyComplete(s) &&
    isServiceComplete(s) &&
    isAddressComplete(s) &&
    isDetailsComplete(s),
  date: (s) =>
    isPropertyComplete(s) &&
    isServiceComplete(s) &&
    isAddressComplete(s) &&
    isDetailsComplete(s) &&
    isExtrasComplete(s),
  time: (s) =>
    isPropertyComplete(s) &&
    isServiceComplete(s) &&
    isAddressComplete(s) &&
    isDetailsComplete(s) &&
    isExtrasComplete(s) &&
    isDateComplete(s),
  access: (s) =>
    isPropertyComplete(s) &&
    isServiceComplete(s) &&
    isAddressComplete(s) &&
    isDetailsComplete(s) &&
    isExtrasComplete(s) &&
    isScheduleComplete(s),
  review: isReviewReady,
  payment: isReviewReady,
};

/**
 * If the user shouldn't be on this screen yet, return the path to redirect to.
 * Returns null when the screen is allowed.
 */
export function getGuardRedirect(
  screenId: BookingScreenId,
  state: BookingState,
): string | null {
  if (COMPLETION[screenId](state)) {
    // Skip add-ons for quote-only services
    if (
      screenId === "addons" &&
      state.serviceType &&
      isQuoteOnlyService(state.serviceType)
    ) {
      return BOOKING_SCREEN_PATHS.date;
    }
    // ASAP already has a window — skip time picker
    if (screenId === "time" && state.schedulePreset === "asap" && isTimeComplete(state)) {
      return BOOKING_SCREEN_PATHS.access;
    }
    return null;
  }

  if (!isPropertyComplete(state)) return BOOKING_SCREEN_PATHS.property;
  if (!isServiceComplete(state)) return BOOKING_SCREEN_PATHS.service;
  if (!isAddressComplete(state)) return BOOKING_SCREEN_PATHS.address;
  if (!isDetailsComplete(state)) return BOOKING_SCREEN_PATHS.details;
  if (!isExtrasComplete(state)) return BOOKING_SCREEN_PATHS.addons;
  if (!isDateComplete(state)) return BOOKING_SCREEN_PATHS.date;
  if (!isTimeComplete(state)) return BOOKING_SCREEN_PATHS.time;
  return BOOKING_SCREEN_PATHS.access;
}

export function getPreviousScreen(
  screenId: BookingScreenId,
  state: BookingState,
): BookingScreenId | null {
  const index = getBookingScreenIndex(screenId);
  if (index <= 0) return null;

  let prev = BOOKING_SCREENS[index - 1]!.id;
  if (prev === "welcome") {
    return "welcome";
  }
  if (
    prev === "addons" &&
    state.serviceType &&
    isQuoteOnlyService(state.serviceType)
  ) {
    prev = "details";
  }
  if (prev === "time" && state.schedulePreset === "asap") {
    prev = "date";
  }
  return prev;
}

export function getNextScreen(
  screenId: BookingScreenId,
  state: BookingState,
): BookingScreenId {
  const index = getBookingScreenIndex(screenId);
  if (index >= BOOKING_SCREENS.length - 1) return "payment";

  let next = BOOKING_SCREENS[index + 1]!.id;
  if (
    next === "addons" &&
    state.serviceType &&
    isQuoteOnlyService(state.serviceType)
  ) {
    next = "date";
  }
  if (next === "time" && state.schedulePreset === "asap") {
    next = "access";
  }
  return next;
}

/** Resolve entry for /book — start at welcome splash. */
export function getBookingEntryPath(options?: {
  hasUsualClean?: boolean;
  prefillAddress?: boolean;
}): string {
  if (options?.prefillAddress) return BOOKING_SCREEN_PATHS.address;
  if (options?.hasUsualClean) return BOOKING_SCREEN_PATHS.address;
  return BOOKING_SCREEN_PATHS.welcome;
}

/**
 * Furthest incomplete screen for abandoned-draft recovery.
 */
export function getFurthestScreenPath(state: BookingState): string {
  if (!isPropertyComplete(state)) return BOOKING_SCREEN_PATHS.property;
  if (!isServiceComplete(state)) return BOOKING_SCREEN_PATHS.service;
  if (!isAddressComplete(state)) return BOOKING_SCREEN_PATHS.address;
  if (!isDetailsComplete(state)) return BOOKING_SCREEN_PATHS.details;
  if (!isExtrasComplete(state)) return BOOKING_SCREEN_PATHS.addons;
  if (!isDateComplete(state)) return BOOKING_SCREEN_PATHS.date;
  if (!isTimeComplete(state)) return BOOKING_SCREEN_PATHS.time;
  if (!isAccessComplete()) return BOOKING_SCREEN_PATHS.access;
  if (!isReviewReady(state)) return BOOKING_SCREEN_PATHS.review;
  return BOOKING_SCREEN_PATHS.payment;
}

export function isBookingFlowPathname(pathname: string): boolean {
  // Post-booking `/bookings/*` uses the customer shell — not the question funnel.
  return pathname === "/book" || pathname.startsWith("/book/");
}
