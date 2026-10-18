/**
 * Dispatch outcome recording — auditable, reversible recommendations only.
 * Does not change assignment APIs; call after offer/assign events.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import { emitBrainEvent } from "@/lib/brain/events";

export type DispatchOutcome =
  | "offered"
  | "accepted"
  | "declined"
  | "expired"
  | "admin_assigned"
  | "cancelled";

export async function recordDispatchOutcome(input: {
  bookingId: string;
  outcome: DispatchOutcome;
  offerId?: string | null;
  cleanerId?: string | null;
  matchScore?: number | null;
  factors?: string[];
  latencySeconds?: number | null;
  marketId?: string | null;
}): Promise<{ recorded: boolean }> {
  try {
    await emitBrainEvent({
      eventType:
        input.outcome === "accepted"
          ? "offer_accepted"
          : input.outcome === "declined"
            ? "offer_declined"
            : input.outcome === "expired"
              ? "offer_expired"
              : input.outcome === "admin_assigned"
                ? "admin_assigned"
                : "offer_created",
      bookingId: input.bookingId,
      cleanerId: input.cleanerId,
      marketId: input.marketId,
      payload: {
        outcome: input.outcome,
        matchScore: input.matchScore ?? null,
        latencySeconds: input.latencySeconds ?? null,
      },
    });

    if (!hasAdminEnv()) return { recorded: false };
    const supabase = createAdminClient();
    const { error } = await supabase.from("brain_dispatch_outcomes").insert({
      booking_id: input.bookingId,
      offer_id: input.offerId ?? null,
      cleaner_id: input.cleanerId ?? null,
      outcome: input.outcome,
      match_score: input.matchScore ?? null,
      factors: input.factors ?? [],
      latency_seconds: input.latencySeconds ?? null,
    } as never);

    if (error) {
      if (/brain_dispatch_outcomes|does not exist/i.test(error.message)) {
        return { recorded: false };
      }
      return { recorded: false };
    }
    return { recorded: true };
  } catch {
    return { recorded: false };
  }
}

/** Acceptance rate over recent outcomes — zeros when empty. */
export async function dispatchAcceptanceStats(limit = 200): Promise<{
  sampleSize: number;
  accepted: number;
  declined: number;
  expired: number;
  acceptanceRate: number | null;
  status: "ok" | "INSUFFICIENT_DATA";
}> {
  if (!hasAdminEnv()) {
    return {
      sampleSize: 0,
      accepted: 0,
      declined: 0,
      expired: 0,
      acceptanceRate: null,
      status: "INSUFFICIENT_DATA",
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("brain_dispatch_outcomes")
    .select("outcome")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return {
      sampleSize: 0,
      accepted: 0,
      declined: 0,
      expired: 0,
      acceptanceRate: null,
      status: "INSUFFICIENT_DATA",
    };
  }

  const rows = data as Array<{ outcome?: string }>;
  const sampleSize = rows.length;
  const accepted = rows.filter((r) => r.outcome === "accepted").length;
  const declined = rows.filter((r) => r.outcome === "declined").length;
  const expired = rows.filter((r) => r.outcome === "expired").length;
  const offeredLike = accepted + declined + expired;

  return {
    sampleSize,
    accepted,
    declined,
    expired,
    acceptanceRate: offeredLike > 0 ? accepted / offeredLike : null,
    status: sampleSize >= 10 ? "ok" : "INSUFFICIENT_DATA",
  };
}
