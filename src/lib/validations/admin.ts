import { z } from "zod";

export const bookingFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  serviceType: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum([
    "draft",
    "pending_payment",
    "confirmed",
    "awaiting_assignment",
    "offered",
    "assigned",
    "accepted",
    "on_the_way",
    "arrived",
    "in_progress",
    "completed",
    "cancelled",
  ]),
});

export const assignCleanerSchema = z.object({
  professionalProfileId: z.string().uuid(),
});

export const cancelAssignmentSchema = z.object({
  action: z.literal("cancel_assignment"),
  reason: z.string().trim().max(500).optional(),
});

export const cancelBookingSchema = z.object({
  action: z.literal("cancel"),
  reason: z.string().trim().max(500).optional(),
});

export const bulkBookingActionSchema = z.object({
  action: z.enum(["cancel", "confirm"]),
  ids: z.array(z.string().uuid()).min(1),
});

export const updateSupportIssueSchema = z.object({
  status: z.enum(["open", "investigating", "resolved", "closed"]).optional(),
  resolution: z.string().trim().max(2000).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
});

export const assignProSchema = z.object({
  professionalProfileId: z.string().uuid(),
});

export const updatePricingSchema = z.object({
  baseCents: z.number().int().min(0).optional(),
  bedroomCents: z.number().int().min(0).optional(),
  bathroomCents: z.number().int().min(0).optional(),
  platformFeePercent: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

export const createCouponSchema = z.object({
  code: z.string().trim().min(3).max(32),
  description: z.string().trim().max(200).optional(),
  discountType: z.enum(["percent", "fixed"]),
  discountValue: z.number().int().positive(),
  minOrderCents: z.number().int().min(0).default(0),
  maxUses: z.number().int().positive().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const createServiceAreaSchema = z.object({
  name: z.string().trim().min(1),
  city: z.string().trim().min(1),
  state: z.string().trim().length(2),
  postalCodes: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export const updateDisputeSchema = z.object({
  status: z.enum(["open", "investigating", "resolved", "closed"]).optional(),
  resolution: z.string().trim().max(2000).optional(),
});

export const createRefundSchema = z.object({
  bookingId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  reason: z.string().trim().max(500).optional(),
});

export const bulkCleanerActionSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const reviewCleanerOnboardingSchema = z.object({
  professionalId: z.string().uuid(),
  decision: z.enum(["approve", "reject", "suspend"]),
  rejectionReason: z.string().trim().max(500).optional().nullable(),
});

export const updatePermissionsSchema = z.object({
  targetProfileId: z.string().uuid(),
  roleLabel: z.string().trim().min(1),
  permissions: z.array(z.string()),
});
