/**
 * Booking event log helper.
 * Compatible with Phase 1 (actor_role/metadata) and Phase 2 (actor_type/payload) schemas.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";
import type { BookingStatus } from "@/lib/bookings/status";
import { mirrorCriticalBookingEvent } from "@/lib/events/business-events";

export type BookingEventActorType = "system" | "customer" | "cleaner" | "admin" | "guest";

export interface BookingEventRecord {
  id: string;
  bookingId: string;
  eventType: string;
  actorProfileId: string | null;
  actorRole: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

const SENSITIVE_KEYS = new Set([
  "card_number",
  "cardNumber",
  "cvc",
  "cvv",
  "client_secret",
  "clientSecret",
  "payment_method_details",
]);

function scrub(payload: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!payload) return {};
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (SENSITIVE_KEYS.has(key)) continue;
    clean[key] = value;
  }
  return clean;
}

export function eventTypeForStatusTransition(status: BookingStatus | string): string {
  switch (status) {
    case "awaiting_assignment":
    case "awaiting_cleaner":
      return "awaiting_assignment";
    case "offered":
      return "assignment_offered";
    case "assigned":
    case "accepted":
      return "assignment_assigned";
    case "on_the_way":
    case "cleaner_on_way":
      return "cleaner_on_the_way";
    case "arrived":
    case "cleaner_arrived":
      return "cleaner_arrived";
    case "in_progress":
      return "job_started";
    case "completed":
      return "job_completed";
    case "cancelled":
      return "cancelled";
    case "confirmed":
      return "payment_succeeded";
    default:
      return "status_changed";
  }
}

type EmitInput =
  | {
      bookingId: string;
      eventType: string;
      actorType: BookingEventActorType;
      actorId?: string | null;
      payload?: Record<string, unknown>;
    }
  | {
      bookingId: string;
      type: string;
      actor?: { id?: string | null; role?: string | null };
      metadata?: Record<string, unknown>;
    }
  | {
      bookingId: string;
      eventType: string;
      actorProfileId?: string | null;
      actorRole?: string | null;
      metadata?: Record<string, unknown>;
    };

function normalizeEmit(input: EmitInput): {
  bookingId: string;
  eventType: string;
  actorType: BookingEventActorType;
  actorId: string | null;
  payload: Record<string, unknown>;
} {
  if ("type" in input) {
    const role = (input.actor?.role ?? "system") as BookingEventActorType;
    return {
      bookingId: input.bookingId,
      eventType: input.type,
      actorType: role === "guest" ? "customer" : role,
      actorId: input.actor?.id ?? null,
      payload: scrub(input.metadata),
    };
  }

  if ("actorType" in input) {
    return {
      bookingId: input.bookingId,
      eventType: input.eventType,
      actorType: input.actorType,
      actorId: input.actorId ?? null,
      payload: scrub(input.payload),
    };
  }

  const role = (input.actorRole ?? "system") as BookingEventActorType;
  return {
    bookingId: input.bookingId,
    eventType: input.eventType,
    actorType: role === "guest" ? "customer" : role,
    actorId: input.actorProfileId ?? null,
    payload: scrub(input.metadata),
  };
}

export async function emitBookingEvent(input: EmitInput): Promise<void> {
  if (!hasAdminEnv()) return;

  const normalized = normalizeEmit(input);

  try {
    const supabase = createAdminClient();

    // Prefer Phase 2 / match-engine columns.
    const primary = await supabase.from("booking_events").insert({
      booking_id: normalized.bookingId,
      event_type: normalized.eventType,
      actor_type: normalized.actorType === "guest" ? "customer" : normalized.actorType,
      actor_id: normalized.actorId,
      payload: normalized.payload as Json,
    });

    if (primary.error) {
      // Fallback: Phase 1 columns (actor_role / metadata).
      if (/actor_type|payload|schema cache|column/i.test(primary.error.message)) {
        const fallback = await supabase.from("booking_events").insert({
          booking_id: normalized.bookingId,
          event_type: normalized.eventType,
          actor_id: normalized.actorId,
          actor_role: normalized.actorType,
          metadata: normalized.payload as Json,
        });
        if (fallback.error && !/booking_events|does not exist/i.test(fallback.error.message)) {
          console.error("[booking_events]", fallback.error.message);
        }
      } else if (!/booking_events|does not exist/i.test(primary.error.message)) {
        console.error("[booking_events]", primary.error.message);
      }
    }
  } catch (error) {
    console.error("[booking_events] emit failed", error);
  }

  // Soft-fail mirror for AI OS — never blocks booking path.
  try {
    await mirrorCriticalBookingEvent({
      eventType: normalized.eventType,
      bookingId: normalized.bookingId,
      actorType: normalized.actorType,
      actorId: normalized.actorId,
      payload: normalized.payload,
    });
  } catch {
    /* ignore */
  }
}

export async function listBookingEvents(bookingId: string): Promise<BookingEventRecord[]> {
  if (!hasAdminEnv()) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("booking_events")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });

  if (error) {
    if (/booking_events|does not exist/i.test(error.message)) {
      return listFromJobHistory(bookingId);
    }
    throw new Error(error.message);
  }

  const events = (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const metadata =
      (r.payload as Record<string, unknown> | undefined) ??
      (r.metadata as Record<string, unknown> | undefined) ??
      {};
    return {
      id: String(r.id),
      bookingId: String(r.booking_id),
      eventType: String(r.event_type),
      actorProfileId: r.actor_id ? String(r.actor_id) : null,
      actorRole: r.actor_type
        ? String(r.actor_type)
        : r.actor_role
          ? String(r.actor_role)
          : null,
      metadata,
      createdAt: String(r.created_at),
    };
  });

  if (events.length === 0) {
    return listFromJobHistory(bookingId);
  }

  return events;
}

async function listFromJobHistory(bookingId: string): Promise<BookingEventRecord[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("job_status_history")
    .select("id, booking_id, from_status, to_status, changed_by, note, created_at")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });

  if (error) {
    if (/job_status_history/i.test(error.message)) return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      bookingId: String(r.booking_id),
      eventType: "status_changed",
      actorProfileId: r.changed_by ? String(r.changed_by) : null,
      actorRole: null,
      metadata: {
        fromStatus: r.from_status ?? null,
        toStatus: r.to_status,
        note: r.note ?? null,
        source: "job_status_history",
      },
      createdAt: String(r.created_at),
    };
  });
}
