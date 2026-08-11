import { z } from "zod";
import { ARRIVAL_WINDOWS } from "@/lib/bookings/constants";

const windowIds = ARRIVAL_WINDOWS.map((w) => w.id) as [string, ...string[]];

export const cancelBookingSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const rescheduleBookingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  arrivalWindow: z.enum(windowIds as ["morning", "afternoon", "evening"]),
});

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{7,14}$/)
    .optional()
    .or(z.literal("")),
});

export const notificationPreferencesSchema = z.object({
  emailBookingUpdates: z.boolean(),
  emailPromotions: z.boolean(),
  smsReminders: z.boolean(),
  pushEnabled: z.boolean(),
});

export const favoriteCleanerSchema = z.object({
  professionalProfileId: z.string().uuid(),
});

export const savedAddressSchema = z.object({
  label: z.string().trim().min(1, "Label is required.").max(40),
  formattedAddress: z.string().trim().max(300).optional(),
  addressLine1: z.string().trim().min(3, "Street address is required."),
  unit: z.string().trim().max(40).optional(),
  city: z.string().trim().min(2, "City is required."),
  region: z.string().trim().min(2, "State or province is required."),
  postalCode: z.string().trim().min(3, "Postal code is required."),
  country: z.string().trim().length(2).optional(),
  countryCode: z.string().trim().length(2).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  placeId: z.string().trim().max(300).optional(),
  isDefault: z.boolean().optional(),
});

export const updateSavedAddressSchema = savedAddressSchema.partial().extend({
  label: z.string().trim().min(1).max(40).optional(),
  isDefault: z.boolean().optional(),
});
