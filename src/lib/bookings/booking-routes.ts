import type { BookingState } from "@/lib/bookings/booking-state";
import { isQuoteOnlyService } from "@/config/services";

/**
 * Multi-screen booking funnel — founder 4 panels (after Home):
 * Choose clean → Make it yours → Choose arrival → Review → Pay
 * Legacy sub-routes redirect into these panels.
 */
export const BOOKING_SCREENS = [
  { id: "welcome", path: "/book/welcome", label: "Welcome", shortLabel: "Start" },
  { id: "address", path: "/book/address", label: "Property", shortLabel: "Where" },
  { id: "property", path: "/book/property", label: "Category", shortLabel: "What" },
  { id: "service", path: "/book/service", label: "Service", shortLabel: "Clean" },
  { id: "details", path: "/book/details", label: "Make it yours", shortLabel: "Yours" },
  { id: "addons", path: "/book/addons", label: "Add-ons", shortLabel: "Extras" },
  { id: "date", path: "/book/date", label: "Arrival", shortLabel: "When" },
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

/** Make-it-yours ready — service + home details + extras array. */
export function isCleanPanelComplete(state: BookingState): boolean {
  return (
    isPropertyComplete(state) &&
    isServiceComplete(state) &&
    isDetailsComplete(state) &&
    isExtrasComplete(state)
  );
}

export function isReviewReady(state: BookingState): boolean {
  return (
    isAddressComplete(state) &&
    isCleanPanelComplete(state) &&
    isScheduleComplete(state)
  );
}

/**
 * Guard: prerequisites before entering a screen.
 * Founder path: Home → Choose clean → Make it yours → Arrival → Review.
 */
const COMPLETION: Record<BookingScreenId, (state: BookingState) => boolean> = {
  welcome: () => true,
  address: () => true,
  property: isAddressComplete,
  service: isAddressComplete,
  details: (s) => isAddressComplete(s) && isServiceComplete(s),
  addons: (s) =>
    isAddressComplete(s) &&
    isPropertyComplete(s) &&
    isServiceComplete(s) &&
    isDetailsComplete(s),
  date: (s) => isAddressComplete(s) && isCleanPanelComplete(s),
  time: (s) => isAddressComplete(s) && isCleanPanelComplete(s) && isDateComplete(s),
  access: (s) => isAddressComplete(s) && isCleanPanelComplete(s) && isScheduleComplete(s),
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
  // Collapse legacy mid-screens into founder panels.
  if (screenId === "property" || screenId === "addons") {
    if (!isAddressComplete(state)) return BOOKING_SCREEN_PATHS.address;
    if (!isServiceComplete(state)) return BOOKING_SCREEN_PATHS.service;
    return BOOKING_SCREEN_PATHS.details;
  }
  if (screenId === "time" || screenId === "access") {
    if (!isAddressComplete(state)) return BOOKING_SCREEN_PATHS.address;
    if (!isCleanPanelComplete(state)) {
      return isServiceComplete(state)
        ? BOOKING_SCREEN_PATHS.details
        : BOOKING_SCREEN_PATHS.service;
    }
    return BOOKING_SCREEN_PATHS.date;
  }

  if (COMPLETION[screenId](state)) {
    return null;
  }

  if (!isAddressComplete(state)) return BOOKING_SCREEN_PATHS.address;
  if (!isServiceComplete(state)) return BOOKING_SCREEN_PATHS.service;
  if (!isCleanPanelComplete(state)) return BOOKING_SCREEN_PATHS.details;
  if (!isScheduleComplete(state)) return BOOKING_SCREEN_PATHS.date;
  return BOOKING_SCREEN_PATHS.review;
}

export function getPreviousScreen(
  screenId: BookingScreenId,
  state: BookingState,
): BookingScreenId | null {
  void state;
  switch (screenId) {
    case "welcome":
      return null;
    case "address":
      return "welcome";
    case "property":
    case "service":
      return "address";
    case "details":
    case "addons":
      return "service";
    case "date":
    case "time":
    case "access":
      return "details";
    case "review":
      return "date";
    case "payment":
      return "review";
    default:
      return "address";
  }
}

export function getNextScreen(
  screenId: BookingScreenId,
  state: BookingState,
): BookingScreenId {
  void state;
  switch (screenId) {
    case "welcome":
      return "address";
    case "address":
    case "property":
      return "service";
    case "service":
      return "details";
    case "details":
    case "addons":
      return "date";
    case "date":
    case "time":
    case "access":
      return "review";
    case "review":
      return "payment";
    case "payment":
      return "payment";
    default:
      return "address";
  }
}

/** Resolve entry for /book — address-first (skip welcome splash). */
export function getBookingEntryPath(options?: {
  hasUsualClean?: boolean;
  prefillAddress?: boolean;
}): string {
  if (options?.prefillAddress) return BOOKING_SCREEN_PATHS.address;
  if (options?.hasUsualClean) return BOOKING_SCREEN_PATHS.address;
  return BOOKING_SCREEN_PATHS.address;
}

/**
 * Furthest incomplete screen for abandoned-draft recovery.
 */
export function getFurthestScreenPath(state: BookingState): string {
  if (!isAddressComplete(state)) return BOOKING_SCREEN_PATHS.address;
  if (!isServiceComplete(state)) return BOOKING_SCREEN_PATHS.service;
  if (!isCleanPanelComplete(state)) return BOOKING_SCREEN_PATHS.details;
  if (!isScheduleComplete(state)) return BOOKING_SCREEN_PATHS.date;
  if (!isReviewReady(state)) return BOOKING_SCREEN_PATHS.review;
  return BOOKING_SCREEN_PATHS.payment;
}

export function isBookingFlowPathname(pathname: string): boolean {
  // Post-booking `/bookings/*` uses the customer shell — not the question funnel.
  return pathname === "/book" || pathname.startsWith("/book/");
}

/** Edit links from review — return to review after continue when state stays valid. */
export function bookingEditPath(
  screenId: BookingScreenId,
  options?: { fromReview?: boolean },
): string {
  const base = BOOKING_SCREEN_PATHS[screenId];
  if (options?.fromReview) return `${base}?from=review`;
  return base;
}
