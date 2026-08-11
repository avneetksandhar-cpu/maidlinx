/**
 * Stripe webhook event idempotency — store event.id before side effects.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

export type WebhookClaimResult = "claimed" | "duplicate" | "unavailable";

/**
 * Attempt to claim a Stripe event for processing.
 * Returns `duplicate` if already processed (caller must no-op successfully).
 */
export async function claimStripeWebhookEvent(input: {
  eventId: string;
  eventType: string;
  bookingId?: string | null;
  summary?: Record<string, unknown>;
}): Promise<WebhookClaimResult> {
  if (!hasAdminEnv()) return "unavailable";

  const supabase = createAdminClient();
  const { error } = await supabase.from("stripe_webhook_events").insert({
    id: input.eventId,
    event_type: input.eventType,
    booking_id: input.bookingId ?? null,
    payload_summary: (input.summary ?? {}) as Json,
  });

  if (!error) return "claimed";

  if (/duplicate|unique|already exists/i.test(error.message)) {
    return "duplicate";
  }

  if (/stripe_webhook_events|does not exist|schema cache/i.test(error.message)) {
    return "unavailable";
  }

  throw new Error(error.message);
}
