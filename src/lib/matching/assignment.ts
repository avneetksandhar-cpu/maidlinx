/**
 * Match Engine V1 assignment workflow:
 * confirmed → awaiting_assignment → offer → accept → assigned
 *
 * Concurrency: optimistic lock on bookings.professional_profile_id +
 * unique index on cleaner_assignments(booking_id) WHERE status = 'active'
 * and booking_offers accepted uniqueness.
 */

import { writeAuditLog } from "@/lib/admin/audit";
import { emitBookingEvent } from "@/lib/bookings/events";
import { DEFAULT_OFFER_EXPIRY_HOURS } from "@/lib/matching/config";
import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

const AWAITING_STATUSES = ["confirmed", "awaiting_assignment", "offered"] as const;
const ASSIGNED_STATUSES = ["assigned", "accepted"] as const;

export type OfferStatus = "pending" | "accepted" | "declined" | "expired" | "cancelled";

export interface BookingOffer {
  id: string;
  bookingId: string;
  cleanerId: string;
  status: OfferStatus;
  matchScore: number | null;
  scoreBreakdown: string[];
  offeredBy: string | null;
  createdAt: string;
  expiresAt: string | null;
}

function isUniqueViolation(message: string): boolean {
  return /duplicate key|unique constraint|cleaner_assignments_one_active|booking_offers_one_accepted/i.test(
    message,
  );
}

async function getCleanerByProfileId(profileId: string): Promise<{
  id: string;
  userId: string;
  isActive: boolean;
  approved: boolean;
} | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cleaners")
    .select("id, user_id, is_active, approved")
    .eq("user_id", profileId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    userId: String(row.user_id),
    isActive: row.is_active !== false,
    approved: Boolean(row.approved),
  };
}

async function getCleanerById(cleanerId: string): Promise<{
  id: string;
  userId: string;
} | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cleaners")
    .select("id, user_id")
    .eq("id", cleanerId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return { id: String(data.id), userId: String(data.user_id) };
}

async function cancelActiveAssignments(bookingId: string): Promise<void> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  await supabase
    .from("cleaner_assignments")
    .update({ status: "cancelled", ended_at: now })
    .eq("booking_id", bookingId)
    .eq("status", "active");
}

async function cancelPendingOffers(bookingId: string, exceptOfferId?: string): Promise<void> {
  const supabase = createAdminClient();
  let query = supabase
    .from("booking_offers")
    .update({ status: "cancelled", responded_at: new Date().toISOString() })
    .eq("booking_id", bookingId)
    .eq("status", "pending");

  if (exceptOfferId) {
    query = query.neq("id", exceptOfferId);
  }

  await query;
}

/**
 * Move booking into awaiting_assignment after confirmation/payment.
 */
export async function markAwaitingAssignment(bookingId: string, actorId?: string | null): Promise<void> {
  if (!hasAdminEnv()) throw new Error("Admin environment is not configured.");
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "awaiting_assignment" })
    .eq("id", bookingId)
    .in("status", ["confirmed", "awaiting_assignment"])
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Booking cannot enter awaiting_assignment from its current status.");

  await emitBookingEvent({
    bookingId,
    eventType: "awaiting_assignment",
    actorType: actorId ? "admin" : "system",
    actorId,
  });
}

/**
 * Create a pending offer for a ranked cleaner. Sets booking status to `offered`.
 */
export async function createOffer(input: {
  bookingId: string;
  cleanerId: string;
  matchScore?: number | null;
  scoreBreakdown?: string[];
  offeredBy?: string | null;
  expiryHours?: number;
}): Promise<BookingOffer> {
  if (!hasAdminEnv()) throw new Error("Admin environment is not configured.");
  const supabase = createAdminClient();

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, status, professional_profile_id")
    .eq("id", input.bookingId)
    .maybeSingle();

  if (bookingError) throw new Error(bookingError.message);
  if (!booking) throw new Error("Booking not found.");
  if (booking.professional_profile_id) {
    throw new Error("Booking already has an assigned cleaner.");
  }
  if (!AWAITING_STATUSES.includes(booking.status as (typeof AWAITING_STATUSES)[number])) {
    throw new Error(`Cannot offer from status "${booking.status}".`);
  }

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + (input.expiryHours ?? DEFAULT_OFFER_EXPIRY_HOURS));

  const { data: offer, error: offerError } = await supabase
    .from("booking_offers")
    .insert({
      booking_id: input.bookingId,
      cleaner_id: input.cleanerId,
      status: "pending",
      match_score: input.matchScore ?? null,
      score_breakdown: (input.scoreBreakdown ?? []) as unknown as Json,
      offered_by: input.offeredBy ?? null,
      expires_at: expiresAt.toISOString(),
    })
    .select("*")
    .single();

  if (offerError) {
    if (isUniqueViolation(offerError.message)) {
      throw new Error("An active offer already exists for this cleaner.");
    }
    throw new Error(offerError.message);
  }

  const { error: statusError } = await supabase
    .from("bookings")
    .update({ status: "offered" })
    .eq("id", input.bookingId)
    .in("status", [...AWAITING_STATUSES]);

  if (statusError) throw new Error(statusError.message);

  await emitBookingEvent({
    bookingId: input.bookingId,
    eventType: "offer_created",
    actorType: input.offeredBy ? "admin" : "system",
    actorId: input.offeredBy,
    payload: {
      offerId: offer.id,
      cleanerId: input.cleanerId,
      matchScore: input.matchScore ?? null,
      breakdown: input.scoreBreakdown ?? [],
    },
  });

  if (input.offeredBy) {
    await writeAuditLog({
      adminProfileId: input.offeredBy,
      action: "booking.offer_create",
      entityType: "booking",
      entityId: input.bookingId,
      metadata: { offerId: offer.id, cleanerId: input.cleanerId, matchScore: input.matchScore },
    });
  }

  return mapOffer(offer as Record<string, unknown>);
}

/**
 * Cleaner accepts a pending offer.
 * Optimistic lock: only succeeds if booking still unassigned.
 */
export async function acceptOffer(input: {
  offerId: string;
  cleanerUserId: string;
}): Promise<void> {
  if (!hasAdminEnv()) throw new Error("Admin environment is not configured.");
  const supabase = createAdminClient();

  const { data: offer, error: offerError } = await supabase
    .from("booking_offers")
    .select("*")
    .eq("id", input.offerId)
    .maybeSingle();

  if (offerError) throw new Error(offerError.message);
  if (!offer) throw new Error("Offer not found.");
  if (String(offer.status) !== "pending") {
    throw new Error("Offer is no longer pending.");
  }

  const cleaner = await getCleanerById(String(offer.cleaner_id));
  if (!cleaner || cleaner.userId !== input.cleanerUserId) {
    throw new Error("You do not have access to this offer.");
  }

  if (offer.expires_at && new Date(String(offer.expires_at)).getTime() < Date.now()) {
    await supabase
      .from("booking_offers")
      .update({ status: "expired", responded_at: new Date().toISOString() })
      .eq("id", input.offerId);
    throw new Error("Offer has expired.");
  }

  const bookingId = String(offer.booking_id);
  const now = new Date().toISOString();

  // Optimistic lock — first cleaner to claim wins.
  const { data: claimed, error: claimError } = await supabase
    .from("bookings")
    .update({
      professional_profile_id: cleaner.userId,
      professional_id: cleaner.userId,
      cleaner_id: cleaner.id,
      status: "assigned",
    })
    .eq("id", bookingId)
    .is("professional_profile_id", null)
    .in("status", ["offered", "awaiting_assignment", "confirmed"])
    .select("id")
    .maybeSingle();

  if (claimError) throw new Error(claimError.message);
  if (!claimed) {
    throw new Error("This job was just assigned to another cleaner.");
  }

  const { error: acceptError } = await supabase
    .from("booking_offers")
    .update({ status: "accepted", responded_at: now })
    .eq("id", input.offerId)
    .eq("status", "pending");

  if (acceptError) {
    if (isUniqueViolation(acceptError.message)) {
      throw new Error("This job was just assigned to another cleaner.");
    }
    throw new Error(acceptError.message);
  }

  await cancelPendingOffers(bookingId, input.offerId);

  const { error: assignmentError } = await supabase.from("cleaner_assignments").insert({
    booking_id: bookingId,
    cleaner_id: cleaner.id,
    assigned_by: cleaner.userId,
    source: "offer_accept",
    status: "active",
  });

  if (assignmentError) {
    if (isUniqueViolation(assignmentError.message)) {
      throw new Error("This job was just assigned to another cleaner.");
    }
    throw new Error(assignmentError.message);
  }

  await emitBookingEvent({
    bookingId,
    eventType: "offer_accepted",
    actorType: "cleaner",
    actorId: cleaner.userId,
    payload: { offerId: input.offerId, cleanerId: cleaner.id },
  });
}

/**
 * Admin manual assign / reassign (override). Logs audit + booking event.
 */
export async function adminAssignCleaner(input: {
  bookingId: string;
  professionalProfileId: string;
  adminId: string;
  note?: string;
  isReassign?: boolean;
}): Promise<void> {
  if (!hasAdminEnv()) throw new Error("Admin environment is not configured.");
  const supabase = createAdminClient();

  const cleaner = await getCleanerByProfileId(input.professionalProfileId);
  if (!cleaner) throw new Error("Cleaner not found for the selected user.");
  if (!cleaner.approved || !cleaner.isActive) {
    throw new Error("Only approved, active cleaners can be assigned.");
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, status, professional_profile_id")
    .eq("id", input.bookingId)
    .maybeSingle();

  if (bookingError) throw new Error(bookingError.message);
  if (!booking) throw new Error("Booking not found.");

  const wasAssigned = Boolean(booking.professional_profile_id);
  const reassign = input.isReassign ?? wasAssigned;

  if (reassign) {
    await cancelActiveAssignments(input.bookingId);
  }

  await cancelPendingOffers(input.bookingId);

  const { data: updated, error } = await supabase
    .from("bookings")
    .update({
      professional_profile_id: input.professionalProfileId,
      professional_id: input.professionalProfileId,
      cleaner_id: cleaner.id,
      status: "assigned",
    })
    .eq("id", input.bookingId)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!updated) throw new Error("Unable to assign cleaner.");

  const { error: assignmentError } = await supabase.from("cleaner_assignments").insert({
    booking_id: input.bookingId,
    cleaner_id: cleaner.id,
    assigned_by: input.adminId,
    source: reassign ? "admin_reassign" : "admin_manual",
    status: "active",
    note: input.note ?? null,
  });

  if (assignmentError) {
    if (isUniqueViolation(assignmentError.message)) {
      throw new Error("Booking already has an active assignment. Cancel it first or reassign.");
    }
    throw new Error(assignmentError.message);
  }

  await emitBookingEvent({
    bookingId: input.bookingId,
    eventType: reassign ? "manual_reassign" : "manual_assign",
    actorType: "admin",
    actorId: input.adminId,
    payload: {
      cleanerId: cleaner.id,
      professionalProfileId: input.professionalProfileId,
      previousProfileId: booking.professional_profile_id,
      note: input.note ?? null,
    },
  });

  await writeAuditLog({
    adminProfileId: input.adminId,
    action: reassign ? "booking.reassign" : "booking.assign",
    entityType: "booking",
    entityId: input.bookingId,
    metadata: {
      professionalProfileId: input.professionalProfileId,
      cleanerId: cleaner.id,
      override: true,
    },
  });
}

/**
 * Cancel active assignment and return booking to awaiting_assignment.
 */
export async function cancelAssignment(input: {
  bookingId: string;
  adminId: string;
  reason?: string;
}): Promise<void> {
  if (!hasAdminEnv()) throw new Error("Admin environment is not configured.");
  const supabase = createAdminClient();

  await cancelActiveAssignments(input.bookingId);
  await cancelPendingOffers(input.bookingId);

  const { error } = await supabase
    .from("bookings")
    .update({
      professional_profile_id: null,
      professional_id: null,
      cleaner_id: null,
      status: "awaiting_assignment",
    })
    .eq("id", input.bookingId)
    .in("status", [...ASSIGNED_STATUSES, "offered", "on_the_way"]);

  if (error) throw new Error(error.message);

  await emitBookingEvent({
    bookingId: input.bookingId,
    eventType: "assignment_cancelled",
    actorType: "admin",
    actorId: input.adminId,
    payload: { reason: input.reason ?? null },
  });

  await writeAuditLog({
    adminProfileId: input.adminId,
    action: "booking.cancel_assignment",
    entityType: "booking",
    entityId: input.bookingId,
    metadata: { reason: input.reason ?? null },
  });
}

export async function listOffersForBooking(bookingId: string): Promise<BookingOffer[]> {
  if (!hasAdminEnv()) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("booking_offers")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false });

  if (error) {
    if (/booking_offers|schema cache|does not exist/i.test(error.message)) return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapOffer(row as Record<string, unknown>));
}

export async function listPendingOffersForCleaner(cleanerUserId: string): Promise<BookingOffer[]> {
  if (!hasAdminEnv()) return [];
  const cleaner = await getCleanerByProfileId(cleanerUserId);
  if (!cleaner) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("booking_offers")
    .select("*")
    .eq("cleaner_id", cleaner.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    if (/booking_offers|schema cache|does not exist/i.test(error.message)) return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapOffer(row as Record<string, unknown>));
}

function mapOffer(row: Record<string, unknown>): BookingOffer {
  const breakdown = row.score_breakdown;
  return {
    id: String(row.id),
    bookingId: String(row.booking_id),
    cleanerId: String(row.cleaner_id),
    status: String(row.status) as OfferStatus,
    matchScore: row.match_score != null ? Number(row.match_score) : null,
    scoreBreakdown: Array.isArray(breakdown)
      ? breakdown.map(String)
      : [],
    offeredBy: row.offered_by ? String(row.offered_by) : null,
    createdAt: String(row.created_at),
    expiresAt: row.expires_at ? String(row.expires_at) : null,
  };
}
