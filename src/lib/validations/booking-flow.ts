import { z } from "zod";
import { BOOKING_EXTRAS, BOOKING_SERVICES, ARRIVAL_WINDOWS } from "@/lib/bookings/constants";

const serviceIds = BOOKING_SERVICES.map((s) => s.id) as [string, ...string[]];
const extraIds = BOOKING_EXTRAS.map((e) => e.id) as [string, ...string[]];
const windowIds = ARRIVAL_WINDOWS.map((w) => w.id) as [string, ...string[]];

export const step1AddressSchema = z.object({
  line1: z.string().trim().min(3, "Street address is required."),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(2, "City is required."),
  state: z.string().trim().min(2, "State or province is required."),
  postalCode: z.string().trim().min(3, "Postal code is required."),
  country: z.string().trim().length(2, "Country must be a 2-letter code."),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  googlePlaceId: z.string().trim().optional(),
  formattedAddress: z.string().trim().optional(),
  /** Parsed Places components (optional; line1 remains the display street). */
  streetNumber: z.string().trim().optional(),
  route: z.string().trim().optional(),
  /** Hint only — server resolves market from address via `@/lib/markets`. */
  marketId: z.string().trim().optional(),
  zoneId: z.string().trim().optional(),
});

export const step2PropertySchema = z.object({
  bedrooms: z.coerce.number().int().min(0, "Bedrooms must be 0 or more.").max(20),
  bathrooms: z.coerce.number().int().min(1, "At least one bathroom.").max(20),
  squareFootage: z.coerce
    .number()
    .int()
    .min(200, "Minimum 200 sq ft.")
    .max(20000, "Maximum 20,000 sq ft."),
  propertyType: z
    .enum([
      "house",
      "apartment",
      "condo",
      "office",
      "retail",
      "restaurant",
      "airbnb",
      "move",
      "post_construction",
      "commercial",
      "other",
    ])
    .optional(),
  accessNotes: z.string().trim().max(1000).optional(),
  schedulePreset: z.enum(["asap", "today", "tomorrow", "date"]).optional(),
  notes: z.string().trim().max(1000).optional(),
  serviceAnswers: z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])).optional(),
  serviceSlug: z.string().trim().optional(),
});

export const step3ServiceSchema = z.object({
  serviceType: z.enum(serviceIds as [
    "standard",
    "deep",
    "move_in",
    "move_out",
    "office",
    "airbnb_turnover",
    "post_construction",
    "event_venue",
  ]),
});

export const step4ExtrasSchema = z.object({
  extras: z
    .array(
      z.enum(extraIds as [
        "inside_fridge",
        "inside_oven",
        "inside_cabinets",
        "laundry",
        "windows",
        "garage",
        "patio",
      ]),
    )
    .default([]),
});

export const step5ScheduleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Select a valid date."),
  arrivalWindow: z.enum(windowIds as ["morning", "afternoon", "evening"]),
});

export const step6CustomerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  email: z.string().trim().email("Enter a valid email."),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{7,14}$/, "Enter a valid phone number."),
});

/** @deprecated Use step3ServiceSchema */
export const step2ServiceSchema = step3ServiceSchema;

/** @deprecated Use step2PropertySchema */
export const step3PropertySchema = step2PropertySchema.merge(step4ExtrasSchema);

/** @deprecated Use step5ScheduleSchema */
export const step4ScheduleSchema = step5ScheduleSchema;

/** @deprecated Use step6CustomerSchema */
export const step5CustomerSchema = step6CustomerSchema;

export const bookingQuoteSchema = step1AddressSchema
  .merge(step2PropertySchema)
  .merge(step3ServiceSchema)
  .merge(step4ExtrasSchema)
  .extend({
    /** Optional promo — validated server-side only. */
    promoCode: z.string().trim().max(64).optional(),
  });

export const createBookingRequestSchema = bookingQuoteSchema
  .merge(step5ScheduleSchema)
  .merge(step6CustomerSchema)
  .extend({
    /** Authoritative quote id from POST /api/bookings/quote (optional). */
    quoteId: z.string().uuid().optional(),
    /** Client idempotency key — prevents duplicate pending bookings on retry. */
    idempotencyKey: z.string().trim().min(8).max(128).optional(),
  });

export type Step1Address = z.infer<typeof step1AddressSchema>;
export type Step2Property = z.infer<typeof step2PropertySchema>;
export type Step3Service = z.infer<typeof step3ServiceSchema>;
export type Step4Extras = z.infer<typeof step4ExtrasSchema>;
export type Step5Schedule = z.infer<typeof step5ScheduleSchema>;
export type Step6Customer = z.infer<typeof step6CustomerSchema>;
export type BookingQuoteInput = z.infer<typeof bookingQuoteSchema>;
export type CreateBookingRequest = z.infer<typeof createBookingRequestSchema>;

export type BookingFormState = Partial<
  Step1Address & Step2Property & Step3Service & Step4Extras & Step5Schedule & Step6Customer
>;

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const flattened = error.flatten().fieldErrors;
  return Object.fromEntries(
    Object.entries(flattened).map(([key, messages]) => [key, messages?.[0] ?? "Invalid value."]),
  );
}
