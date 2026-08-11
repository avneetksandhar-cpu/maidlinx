import type { ServiceTileKey } from "@/config/services";
import type { PropertyTypeId as CatalogPropertyTypeId } from "@/config/property-types";
import type { PriceBreakdown } from "@/lib/pricing/types";
import type { BookingFormState } from "@/lib/validations/booking-flow";
import type { ServiceAnswers } from "@/lib/services/questions";

/**
 * Multi-screen booking funnel (one decision per route):
 * ADDRESS → PROPERTY → DETAILS → SERVICE → EXTRAS → SCHEDULE → REVIEW → PAYMENT
 * Post-pay matching lives at /booking/[id].
 *
 * Numeric ids kept for legacy BookingForm step sync; prefer BOOKING_SCREENS paths.
 */
export const BOOKING_FLOW_STEPS = [
  { id: 1, label: "Address", shortLabel: "Where" },
  { id: 2, label: "Property", shortLabel: "Property" },
  { id: 3, label: "Details", shortLabel: "Details" },
  { id: 4, label: "Service", shortLabel: "Service" },
  { id: 5, label: "Extras", shortLabel: "Extras" },
  { id: 6, label: "When", shortLabel: "When" },
  { id: 7, label: "Review", shortLabel: "Review" },
  { id: 8, label: "Payment", shortLabel: "Pay" },
] as const;

/** @deprecated Use BOOKING_FLOW_STEPS — unified wizard for all viewports */
export const DESKTOP_BOOKING_STEPS = BOOKING_FLOW_STEPS;

/** @deprecated Use BOOKING_FLOW_STEPS */
export const MOBILE_WIZARD_STEPS = BOOKING_FLOW_STEPS;

export const BOOKING_FLOW_STEP_COUNT = BOOKING_FLOW_STEPS.length;

/** @deprecated Prefer /book/payment route */
export const BOOKING_PAYMENT_STEP = 8;
/** @deprecated Prefer /booking/[id] route */
export const BOOKING_MATCHING_STEP = 9;

export {
  PROPERTY_TYPES,
  getPropertyType,
  getPropertyQuestions,
} from "@/config/property-types";

/** Includes legacy `condo` from older drafts / rebook URLs. */
export type PropertyTypeId = CatalogPropertyTypeId | "condo";

export const SQUARE_FOOTAGE_OPTIONS = [
  { value: 800, label: "Up to 1,000 sq ft" },
  { value: 1500, label: "1,001 – 2,000 sq ft" },
  { value: 2500, label: "2,001 – 3,000 sq ft" },
  { value: 3500, label: "3,001+ sq ft" },
] as const;

export const BOOKING_STATE_STORAGE_KEY = "maidlinx_booking_state";

export type SchedulePreset = "asap" | "today" | "tomorrow" | "date";

export type BookingState = Omit<BookingFormState, "propertyType"> & {
  propertyType?: PropertyTypeId;
  step?: number;
  quote?: PriceBreakdown | null;
  bookingId?: string;
  serviceTile?: ServiceTileKey | null;
  /** Selected Uber-style service tier card id (standard/deep/move/pro/…). */
  serviceTierId?: string | null;
  serviceAnswers?: ServiceAnswers;
  inServiceArea?: boolean;
  marketName?: string | null;
  /** When true (logged-in), persist address after booking create. */
  saveAddressForNextTime?: boolean;
  saveAddressLabel?: string;
  /** ASAP / Today / Tomorrow / pick a date */
  schedulePreset?: SchedulePreset;
  /** Entry, parking, gate codes — appended into notes at create. */
  accessNotes?: string;
  /** Prompt after successful book to remember usual clean */
  offerSaveUsual?: boolean;
};

export const DEFAULT_BOOKING_STATE: BookingState = {
  country: "US",
  extras: [],
  bedrooms: 2,
  bathrooms: 2,
  squareFootage: 1500,
  propertyType: undefined,
  serviceType: undefined,
  serviceSlug: undefined,
  serviceTile: null,
  serviceTierId: null,
  serviceAnswers: {},
  step: 1,
  schedulePreset: undefined,
  accessNotes: "",
};
