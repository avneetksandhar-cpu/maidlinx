import { isQuoteOnlyService } from "@/config/services";
import type { BookingState } from "@/lib/bookings/booking-state";
import { validateServiceAnswers, type ServiceAnswers } from "@/lib/services/questions";
import { getPropertyQuestions } from "@/config/property-types";
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

  return parsed.success ? parsed.data : null;
}

export function validateDetailsState(state: BookingState): {
  ok: boolean;
  errors: Record<string, string>;
} {
  if (!state.propertyType) {
    return { ok: false, errors: { propertyType: "Select a property type." } };
  }

  const propertyQuestions = getPropertyQuestions(state.propertyType);
  const answers: ServiceAnswers = {
    ...(state.serviceAnswers ?? {}),
    ...(state.bedrooms !== undefined ? { bedrooms: state.bedrooms } : {}),
    ...(state.bathrooms !== undefined ? { bathrooms: state.bathrooms } : {}),
    ...(state.squareFootage !== undefined ? { squareFootage: state.squareFootage } : {}),
    ...(state.propertyType ? { propertyType: state.propertyType } : {}),
  };
  const propertyResult = validateServiceAnswers(propertyQuestions, answers);
  if (!propertyResult.ok) {
    return { ok: false, errors: propertyResult.errors };
  }

  const property = step2PropertySchema.safeParse({
    bedrooms: state.bedrooms ?? 0,
    bathrooms: state.bathrooms ?? 1,
    squareFootage: state.squareFootage ?? 1500,
    propertyType: state.propertyType,
    notes: state.notes,
    accessNotes: state.accessNotes,
    serviceAnswers: state.serviceAnswers,
  });
  if (!property.success) {
    return { ok: false, errors: fieldErrors(property.error) };
  }

  return { ok: true, errors: {} };
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
