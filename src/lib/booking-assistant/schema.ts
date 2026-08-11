import { z } from "zod";
import {
  ARRIVAL_WINDOWS,
  BOOKING_EXTRAS,
  BOOKING_SERVICES,
} from "@/lib/bookings/constants";

const serviceIds = BOOKING_SERVICES.map((s) => s.id) as [string, ...string[]];
const extraIds = BOOKING_EXTRAS.map((e) => e.id) as [string, ...string[]];
const windowIds = ARRIVAL_WINDOWS.map((w) => w.id) as [string, ...string[]];

export const PROPERTY_TYPE_IDS = [
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
] as const;

export const MISSING_FIELD_IDS = [
  "addressQuery",
  "serviceType",
  "propertyType",
  "bedrooms",
  "bathrooms",
  "squareFeet",
  "date",
  "timePreference",
] as const;

export type MissingFieldId = (typeof MISSING_FIELD_IDS)[number];

/** Structured booking draft from NL interpretation — never a final Places address. */
export const bookingAssistantDraftSchema = z.object({
  addressQuery: z.string().trim().max(300).optional(),
  propertyType: z.enum(PROPERTY_TYPE_IDS).optional(),
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(1).max(20).optional(),
  squareFeet: z.number().int().min(200).max(20000).optional(),
  serviceType: z.enum(serviceIds as [
    "standard",
    "deep",
    "move_in",
    "move_out",
    "office",
    "airbnb_turnover",
    "post_construction",
    "event_venue",
  ]).optional(),
  addons: z.array(z.enum(extraIds as [
    "inside_fridge",
    "inside_oven",
    "inside_cabinets",
    "laundry",
    "windows",
    "garage",
    "patio",
  ])).default([]),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  schedulePreset: z.enum(["asap", "today", "tomorrow", "date"]).optional(),
  timePreference: z.enum(windowIds as ["morning", "afternoon", "evening"]).optional(),
  unit: z.string().trim().max(80).optional(),
  accessInstructions: z.string().trim().max(1000).optional(),
  specialNotes: z.string().trim().max(1000).optional(),
});

export type BookingAssistantDraft = z.infer<typeof bookingAssistantDraftSchema>;

export const interpretRequestSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  draft: bookingAssistantDraftSchema.partial().optional(),
  /** ISO date of "today" in the client's local calendar (YYYY-MM-DD). */
  today: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  /** Whether the customer has confirmed a Places address in the UI. */
  addressConfirmed: z.boolean().optional(),
});

export type InterpretRequest = z.infer<typeof interpretRequestSchema>;

export const interpretResponseSchema = z.object({
  draft: bookingAssistantDraftSchema,
  missingField: z.enum(MISSING_FIELD_IDS).nullable(),
  followUpQuestion: z.string().nullable(),
  summary: z.string(),
  readyForConfirm: z.boolean(),
  needsAddressConfirm: z.boolean(),
  parser: z.enum(["rules", "llm"]),
  assistantMessage: z.string(),
});

export type InterpretResponse = z.infer<typeof interpretResponseSchema>;
