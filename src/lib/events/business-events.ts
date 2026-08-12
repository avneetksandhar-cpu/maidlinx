/**
 * Cross-domain business event bus for AI OS.
 * Soft-fail + idempotent — never throws to callers; never blocks booking/payment.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

const SENSITIVE_KEYS = new Set([
  "card_number",
  "cardNumber",
  "cvc",
  "cvv",
  "client_secret",
  "clientSecret",
  "payment_method_details",
  "authorization",
  "password",
  "stripe_secret",
]);

/** Critical booking/payment signals mirrored into business_events. */
export const CRITICAL_BUSINESS_EVENT_TYPES = [
  "booking_created",
  "payment_succeeded",
  "offer_accepted",
] as const;

export type CriticalBusinessEventType =
  (typeof CRITICAL_BUSINESS_EVENT_TYPES)[number];

export function isCriticalBusinessEventType(
  eventType: string,
): eventType is CriticalBusinessEventType {
  return (CRITICAL_BUSINESS_EVENT_TYPES as readonly string[]).includes(eventType);
}

function scrub(payload: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!payload) return {};
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (SENSITIVE_KEYS.has(key)) continue;
    clean[key] = value;
  }
  return clean;
}

export function buildBusinessEventIdempotencyKey(input: {
  eventType: string;
  entityType: string;
  entityId: string;
  discriminator?: string | null;
}): string {
  const disc = input.discriminator?.trim() || "v1";
  return `${input.eventType}:${input.entityType}:${input.entityId}:${disc}`;
}

export async function emitBusinessEvent(input: {
  eventType: string;
  entityType: string;
  entityId: string;
  idempotencyKey?: string;
  discriminator?: string | null;
  actorType?: string | null;
  actorId?: string | null;
  source?: string;
  payload?: Record<string, unknown>;
}): Promise<{ recorded: boolean; duplicate?: boolean; reason?: string }> {
  try {
    if (!hasAdminEnv()) {
      return { recorded: false, reason: "Database not configured." };
    }

    const idempotencyKey =
      input.idempotencyKey ??
      buildBusinessEventIdempotencyKey({
        eventType: input.eventType,
        entityType: input.entityType,
        entityId: input.entityId,
        discriminator: input.discriminator,
      });

    const supabase = createAdminClient();
    const { error } = await supabase.from("business_events").insert({
      event_type: input.eventType,
      entity_type: input.entityType,
      entity_id: input.entityId,
      idempotency_key: idempotencyKey,
      actor_type: input.actorType ?? null,
      actor_id: input.actorId ?? null,
      source: input.source ?? "system",
      payload: scrub(input.payload) as Json,
    } as never);

    if (!error) return { recorded: true };

    if (/duplicate|unique|business_events_idempotency/i.test(error.message)) {
      return { recorded: false, duplicate: true };
    }
    if (/business_events|does not exist|schema cache/i.test(error.message)) {
      return {
        recorded: false,
        reason: "Apply migration 00030 (business_events).",
      };
    }
    return { recorded: false, reason: error.message };
  } catch (err) {
    return {
      recorded: false,
      reason: err instanceof Error ? err.message : "Emit failed.",
    };
  }
}

/** Mirror a booking lifecycle event when it is in the critical set. */
export async function mirrorCriticalBookingEvent(input: {
  eventType: string;
  bookingId: string;
  actorType?: string | null;
  actorId?: string | null;
  payload?: Record<string, unknown>;
}): Promise<void> {
  if (!isCriticalBusinessEventType(input.eventType)) return;

  // Env fast-path (no DB): AI_BUSINESS_EVENTS=0|false disables mirrors without redeploy delay.
  const env = process.env.AI_BUSINESS_EVENTS;
  if (env === "0" || env?.toLowerCase() === "false") return;

  let disc = "v1";
  if (input.eventType === "payment_succeeded") {
    const pi = input.payload?.paymentIntentId;
    disc = typeof pi === "string" && pi.length > 0 ? pi : "pay";
  } else if (input.eventType === "offer_accepted") {
    const offerId = input.payload?.offerId;
    disc = typeof offerId === "string" && offerId.length > 0 ? offerId : "v1";
  }

  await emitBusinessEvent({
    eventType: input.eventType,
    entityType: "booking",
    entityId: input.bookingId,
    discriminator: disc,
    actorType: input.actorType,
    actorId: input.actorId,
    source: "booking_events",
    payload: input.payload,
  });
}
