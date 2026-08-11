/**
 * Recurring bookings architecture (STUB / PARTIAL).
 *
 * Tables: recurring_plans, recurring_occurrences (migration 00017).
 * Full occurrence → booking generation is DEFERRED — do not fake generation.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

export const RECURRING_GENERATION_IMPLEMENTED = false;

export type RecurringFrequency = "weekly" | "biweekly" | "monthly";

export interface CreateRecurringPlanInput {
  customerId?: string | null;
  customerEmail?: string | null;
  serviceType: string;
  extras?: string[];
  frequency: RecurringFrequency;
  preferredArrivalWindow?: string | null;
  preferredDayOfWeek?: number | null;
  marketId?: string | null;
  currency?: "USD" | "CAD";
  addressSnapshot: Record<string, unknown>;
  sourceBookingId?: string | null;
  nextOccurrenceDate?: string | null;
  notes?: string | null;
}

export async function createRecurringPlanStub(
  input: CreateRecurringPlanInput,
): Promise<{ id: string; generationImplemented: false }> {
  if (!hasAdminEnv()) {
    throw new Error("Database is not configured.");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("recurring_plans")
    .insert({
      customer_id: input.customerId ?? null,
      customer_email: input.customerEmail ?? null,
      address_snapshot: input.addressSnapshot as Json,
      service_type: input.serviceType,
      extras: input.extras ?? [],
      frequency: input.frequency,
      preferred_arrival_window: input.preferredArrivalWindow ?? null,
      preferred_day_of_week: input.preferredDayOfWeek ?? null,
      market_id: input.marketId ?? null,
      currency: input.currency ?? "USD",
      status: "active",
      next_occurrence_date: input.nextOccurrenceDate ?? null,
      source_booking_id: input.sourceBookingId ?? null,
      notes: input.notes ?? null,
    })
    .select("id")
    .single();

  if (error) {
    if (/recurring_plans|does not exist|schema cache/i.test(error.message)) {
      throw new Error(
        "Recurring plans table missing. Apply migration 00017. Occurrence generation is not implemented yet.",
      );
    }
    throw new Error(error.message);
  }

  return { id: String(data.id), generationImplemented: false };
}

/**
 * Intentionally not implemented — returns empty and documents the gap.
 * Do not invent bookings from a cadence without a real generator + payment consent.
 */
export async function generateDueOccurrences(_asOf = new Date()): Promise<{
  generated: number;
  deferred: true;
  message: string;
}> {
  void _asOf;
  return {
    generated: 0,
    deferred: true,
    message:
      "Recurring occurrence generation is not implemented. Plans may be stored; bookings are not auto-created.",
  };
}
