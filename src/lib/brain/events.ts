/**
 * Brain event pipeline — fire-and-forget durable signals.
 * Never throws to callers; never blocks checkout.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import {
  sanitizeBrainPayload,
  type BrainEventType,
} from "@/lib/brain/types";

export async function emitBrainEvent(input: {
  eventType: BrainEventType;
  marketId?: string | null;
  zoneId?: string | null;
  bookingId?: string | null;
  cleanerId?: string | null;
  sessionKey?: string | null;
  payload?: Record<string, unknown>;
}): Promise<{ recorded: boolean }> {
  try {
    if (!hasAdminEnv()) return { recorded: false };
    const supabase = createAdminClient();
    const { error } = await supabase.from("brain_events").insert({
      event_type: input.eventType,
      market_id: input.marketId ?? null,
      zone_id: input.zoneId ?? null,
      booking_id: input.bookingId ?? null,
      cleaner_id: input.cleanerId ?? null,
      session_key: input.sessionKey ?? null,
      payload: sanitizeBrainPayload(input.payload),
    } as never);

    if (error) {
      if (/brain_events|does not exist|schema cache/i.test(error.message)) {
        return { recorded: false };
      }
      // Soft-fail — intelligence must not break booking.
      return { recorded: false };
    }
    return { recorded: true };
  } catch {
    return { recorded: false };
  }
}
