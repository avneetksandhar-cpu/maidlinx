import { z } from "zod";
import { BOOKING_STATUSES } from "@/lib/bookings/status";
import { addressSchema } from "./common";

export const bookingStatusSchema = z.enum(BOOKING_STATUSES);

export const serviceTypeSchema = z.enum([
  "standard",
  "deep",
  "move_in_out",
  "commercial",
  "airbnb_turnover",
]);

export const createBookingSchema = z.object({
  serviceType: serviceTypeSchema,
  scheduledAt: z.string().datetime({ offset: true }),
  address: addressSchema,
  notes: z.string().trim().max(1000).optional(),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().int().min(1).max(20),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type BookingStatus = z.infer<typeof bookingStatusSchema>;
export type ServiceType = z.infer<typeof serviceTypeSchema>;
