import { isQuoteOnlyService } from "@/config/services";
import type { BookingState } from "@/lib/bookings/booking-state";
import { validateServiceAnswers, type ServiceAnswers } from "@/lib/services/questions";
import { getPropertyQuestions } from "@/config/property-types";
import { resolveServiceArea } from "@/lib/service-area";
import {
  step1AddressSchema,
  step2PropertySchema,
  step3ServiceSchema,
  step4ExtrasSchema,
  step5ScheduleSchema,
  step6CustomerSchema,
  fieldErrors,
  type BookingQuoteInput,
  type CreateBookingRequest,
} from "@/lib/validations/booking-flow";

/**
 * Merge an address patch onto the current draft and resolve service area.
 * Partial keystrokes must not wipe marketId or sticky-false out-of-area.
 */
export function buildAddressStatePatch(
  current: BookingState,
  patch: Partial<BookingState>,
): Partial<BookingState> {
  const merged = {
    line1: patch.line1 ?? current.line1,
    line2: patch.line2 !== undefined ? patch.line2 : current.line2,
    city: patch.city ?? current.city,
    state: patch.state ?? current.state,
    postalCode: patch.postalCode ?? current.postalCode,
    country: patch.country ?? current.country ?? "US",
    latitude: patch.latitude !== undefined ? patch.latitude : current.latitude,
    longitude: patch.longitude !== undefined ? patch.longitude : current.longitude,
    googlePlaceId:
      patch.googlePlaceId !== undefined ? patch.googlePlaceId : current.googlePlaceId,
    formattedAddress:
      patch.formattedAddress !== undefined ? patch.formattedAddress : current.formattedAddress,
    streetNumber: patch.streetNumber !== undefined ? patch.streetNumber : current.streetNumber,
    route: patch.route !== undefined ? patch.route : current.route,
  };

  const hasServiceAreaSignal = Boolean(
    merged.postalCode?.trim() || (merged.city?.trim() && merged.state?.trim()),
  );

  if (!hasServiceAreaSignal) {
    // Incomplete address — update fields only; keep prior market / in-area flags.
    return { ...patch };
  }

  const area = resolveServiceArea({
    postalCode: merged.postalCode,
    city: merged.city,
    state: merged.state,
    country: merged.country,
  });

  return {
    ...patch,
    marketId: area.marketId,
    zoneId: area.zoneId,
    inServiceArea: area.inServiceArea,
    marketName: area.marketName ?? null,
    step: area.inServiceArea ? 2 : 1,
  };
}

export function buildQuoteInput(
  state: BookingState,
  options: { requireAddress?: boolean; allowPreview?: boolean } = {},
): BookingQuoteInput | null {
  if (!state.serviceType) return null;

  const hasAddress = Boolean(state.line1?.trim() && state.city?.trim() && state.postalCode?.trim());
  if (options.requireAddress && !hasAddress) return null;
  if (!hasAddress && !options.allowPreview) return null;

  return {
    line1: state.line1?.trim() || "123 Preview St",
    line2: state.line2,
    city: state.city?.trim() || "Preview",
    state: state.state?.trim() || "CA",
    postalCode: state.postalCode?.trim() || "00000",
    country: state.country ?? "US",
    latitude: state.latitude,
    longitude: state.longitude,
    googlePlaceId: state.googlePlaceId,
    formattedAddress: state.formattedAddress,
    marketId: state.marketId,
    zoneId: state.zoneId,
    serviceType: state.serviceType,
    serviceSlug: state.serviceSlug,
    serviceAnswers: state.serviceAnswers,
    propertyType: state.propertyType,
    bedrooms: state.bedrooms ?? 0,
    bathrooms: state.bathrooms ?? 1,
    squareFootage: state.squareFootage ?? 1000,
    extras: state.extras ?? [],
    notes: state.notes,
    accessNotes: state.accessNotes,
    schedulePreset: state.schedulePreset,
    promoCode: state.promoCode,
  };
}

export function mergeNotes(state: BookingState): string | undefined {
  const parts = [
    state.notes?.trim(),
    state.accessNotes?.trim() ? `Access: ${state.accessNotes.trim()}` : "",
  ].filter(Boolean);
  return parts.length ? parts.join("\n\n") : undefined;
}

export function buildCreateBookingRequest(state: BookingState): CreateBookingRequest | null {
  const parsed = step1AddressSchema
    .merge(step2PropertySchema)
    .merge(step3ServiceSchema)
    .merge(step4ExtrasSchema)
    .merge(step5ScheduleSchema)
    .merge(step6CustomerSchema)
    .safeParse({
      ...state,
      bedrooms: state.bedrooms ?? 0,
      bathrooms: state.bathrooms ?? 1,
      squareFootage: state.squareFootage ?? 1000,
      extras: state.extras ?? [],
      serviceAnswers: state.serviceAnswers ?? {},
      serviceSlug: state.serviceSlug,
      notes: mergeNotes(state),
    });

  if (!parsed.success) return null;

  return {
    ...parsed.data,
    promoCode: state.promoCode,
    preferredCleanerId: state.preferredCleanerId,
    recurringFrequency: state.recurringFrequency,
    rebookSourceBookingId: state.rebookSourceBookingId,
  };
}

export function validateDetailsState(state: BookingState): {
  ok: boolean;
  errors: Record<string, string>;
  /** Coalesced fields that must be written before leaving Details (guard uses raw state). */
  synced?: Pick<BookingState, "bedrooms" | "bathrooms" | "squareFootage">;
} {
  if (!state.propertyType) {
    return { ok: false, errors: { propertyType: "Select a property type." } };
  }

  const commercial =
    state.propertyType === "office" ||
    state.propertyType === "retail" ||
    state.propertyType === "restaurant" ||
    state.propertyType === "commercial" ||
    state.propertyType === "post_construction";

  const synced = {
    bedrooms: state.bedrooms ?? (commercial ? 0 : 2),
    bathrooms: state.bathrooms ?? (commercial ? 1 : 2),
    squareFootage: state.squareFootage ?? 1500,
  };

  const propertyQuestions = getPropertyQuestions(state.propertyType);
  const answers: ServiceAnswers = {
    ...(state.serviceAnswers ?? {}),
    bedrooms: synced.bedrooms,
    bathrooms: synced.bathrooms,
    squareFootage: synced.squareFootage,
    ...(state.propertyType ? { propertyType: state.propertyType } : {}),
  };
  const propertyResult = validateServiceAnswers(propertyQuestions, answers);
  if (!propertyResult.ok) {
    return { ok: false, errors: propertyResult.errors };
  }

  const property = step2PropertySchema.safeParse({
    bedrooms: synced.bedrooms,
    bathrooms: synced.bathrooms,
    squareFootage: synced.squareFootage,
    propertyType: state.propertyType,
    notes: state.notes,
    accessNotes: state.accessNotes,
    serviceAnswers: state.serviceAnswers,
  });
  if (!property.success) {
    return { ok: false, errors: fieldErrors(property.error) };
  }

  return { ok: true, errors: {}, synced };
}

export function isQuoteOnlyBooking(state: BookingState): boolean {
  return Boolean(state.serviceType && isQuoteOnlyService(state.serviceType));
}

export {
  step1AddressSchema,
  step3ServiceSchema,
  step4ExtrasSchema,
  step5ScheduleSchema,
  step6CustomerSchema,
  fieldErrors,
};
