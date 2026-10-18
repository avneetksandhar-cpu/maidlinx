import { z } from "zod";
import { ARRIVAL_WINDOWS } from "@/lib/bookings/constants";

const windowIds = ARRIVAL_WINDOWS.map((w) => w.id) as [string, ...string[]];

export const acceptJobSchema = z.object({
  action: z.literal("accept"),
});

export const startJobSchema = z.object({
  action: z.literal("start"),
});

export const completeJobSchema = z.object({
  action: z.literal("complete"),
});

export const updateChecklistSchema = z.object({
  action: z.literal("checklist"),
  checklist: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      completed: z.boolean(),
    }),
  ),
});

export const updateProProfileSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{7,14}$/)
    .optional()
    .or(z.literal("")),
  bio: z.string().trim().max(1000).optional(),
  yearsExperience: z.coerce.number().int().min(0).max(50).optional(),
  serviceRadiusKm: z.coerce.number().min(5).max(100).optional(),
});

export const availabilitySchema = z.object({
  slots: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      arrivalWindow: z.enum(windowIds as ["morning", "afternoon", "evening"]),
      isAvailable: z.boolean(),
    }),
  ),
});

export const photoTypeSchema = z.enum(["before", "after"]);

export const updateCapabilitiesSchema = z.object({
  serviceIds: z.array(z.string()).max(50),
  zoneIds: z.array(z.string()).max(50),
  /** Explicit home market — must be a launch market when set. */
  marketId: z.enum(["TORONTO_GTA", "SOUTH_FLORIDA"]).nullable().optional(),
  hasVehicle: z.boolean().optional(),
  travelRadiusKm: z.coerce.number().min(5).max(100).nullable().optional(),
});

export const presenceSchema = z.object({
  isOnline: z.boolean(),
});

export const onboardingStepSchema = z.object({
  step: z.enum([
    "personal",
    "profile",
    "service_areas",
    "services",
    "availability",
    "documents",
    "agreements",
    "payout",
    "review",
    "approval",
  ]),
  complete: z.boolean().default(true),
  marketId: z.string().trim().max(64).optional().nullable(),
  languages: z.array(z.string().trim().min(1).max(32)).max(12).optional(),
  transportation: z.string().trim().max(64).optional().nullable(),
  acceptAgreements: z.boolean().optional(),
});

export const onboardingSubmitSchema = z.object({
  action: z.literal("submit"),
});

export const registerDocumentSchema = z.object({
  docType: z.enum(["id_front", "id_back", "selfie", "work_auth", "insurance", "other"]),
  storagePath: z.string().trim().min(3).max(500),
  fileName: z.string().trim().max(255).optional().nullable(),
  mimeType: z.string().trim().max(120).optional().nullable(),
});

export const unavailableDateSchema = z.object({
  unavailableDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().trim().max(200).optional().nullable(),
});

export const removeUnavailableDateSchema = z.object({
  unavailableDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
