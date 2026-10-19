/**
 * Active cleaner GPS for customer en-route tracking.
 * Privacy: current point only (upsert), only on_the_way / arrived, cleared otherwise.
 */

import { estimateTravelMinutes } from "@/lib/eta";
import { isLiveLocationStatus, normalizeBookingStatus } from "@/lib/bookings/status";
import { createAdminClient } from "@/lib/supabase/admin";

export interface CleanerLiveLocation {
  bookingId: string;
  cleanerId: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  updatedAt: string;
}

export interface CustomerLiveLocationView {
  available: boolean;
  reason?: string;
  lat?: number;
  lng?: number;
  accuracy?: number | null;
  updatedAt?: string;
  etaMinutes?: number | null;
  customerLat?: number | null;
  customerLng?: number | null;
  status?: string;
}

export function canShareLiveLocation(status: string): boolean {
  return isLiveLocationStatus(status);
}

export function canCustomerReadLiveLocation(params: {
  status: string;
  hasAssignedCleaner: boolean;
}): boolean {
  return params.hasAssignedCleaner && isLiveLocationStatus(params.status);
}

function mapRow(row: Record<string, unknown>): CleanerLiveLocation {
  return {
    bookingId: String(row.booking_id),
    cleanerId: String(row.cleaner_id),
    lat: Number(row.lat),
    lng: Number(row.lng),
    accuracy: row.accuracy != null ? Number(row.accuracy) : null,
    updatedAt: String(row.updated_at),
  };
}

export async function upsertCleanerLiveLocation(input: {
  bookingId: string;
  cleanerId: string;
  lat: number;
  lng: number;
  accuracy?: number | null;
}): Promise<CleanerLiveLocation> {
  const supabase = createAdminClient();
  const updatedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("cleaner_live_locations")
    .upsert(
      {
        booking_id: input.bookingId,
        cleaner_id: input.cleanerId,
        lat: input.lat,
        lng: input.lng,
        accuracy: input.accuracy ?? null,
        updated_at: updatedAt,
      },
      { onConflict: "booking_id" },
    )
    .select("booking_id, cleaner_id, lat, lng, accuracy, updated_at")
    .single();

  if (error) throw new Error(error.message);
  return mapRow(data as Record<string, unknown>);
}

export async function getCleanerLiveLocation(
  bookingId: string,
): Promise<CleanerLiveLocation | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cleaner_live_locations")
    .select("booking_id, cleaner_id, lat, lng, accuracy, updated_at")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapRow(data as Record<string, unknown>);
}

export async function clearCleanerLiveLocation(bookingId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("cleaner_live_locations")
    .delete()
    .eq("booking_id", bookingId);

  if (error) throw new Error(error.message);
}

/** Clear GPS when the booking leaves live-tracking statuses. */
export async function clearLiveLocationIfNeeded(
  bookingId: string,
  toStatus: string,
): Promise<void> {
  if (canShareLiveLocation(toStatus)) return;
  await clearCleanerLiveLocation(bookingId);
}

export async function assertCleanerCanUpdateLiveLocation(params: {
  bookingId: string;
  professionalProfileId: string;
  cleanerId: string;
}): Promise<{ status: string }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, status, professional_profile_id, cleaner_id")
    .eq("id", params.bookingId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Job not found.");

  const row = data as Record<string, unknown>;
  if (String(row.professional_profile_id ?? "") !== params.professionalProfileId) {
    throw new Error("You do not have access to this job.");
  }

  const bookingCleanerId = row.cleaner_id ? String(row.cleaner_id) : null;
  if (bookingCleanerId && bookingCleanerId !== params.cleanerId) {
    throw new Error("You do not have access to this job.");
  }

  const status = normalizeBookingStatus(String(row.status));
  if (!canShareLiveLocation(String(status))) {
    throw new Error("Live location is only available while en route or arrived.");
  }

  return { status: String(status) };
}

export async function getCustomerLiveLocationView(params: {
  bookingId: string;
  status: string;
  hasAssignedCleaner: boolean;
  customerLat?: number | null;
  customerLng?: number | null;
}): Promise<CustomerLiveLocationView> {
  if (
    !canCustomerReadLiveLocation({
      status: params.status,
      hasAssignedCleaner: params.hasAssignedCleaner,
    })
  ) {
    return {
      available: false,
      reason: "Live tracking is not available for this booking right now.",
      status: params.status,
    };
  }

  const location = await getCleanerLiveLocation(params.bookingId);
  if (!location) {
    return {
      available: false,
      reason: "Waiting for your MaidLinx Pro to share their location.",
      status: params.status,
      customerLat: params.customerLat ?? null,
      customerLng: params.customerLng ?? null,
    };
  }

  const etaMinutes = estimateTravelMinutes({
    originLatitude: location.lat,
    originLongitude: location.lng,
    destinationLatitude: params.customerLat,
    destinationLongitude: params.customerLng,
  });

  return {
    available: true,
    lat: location.lat,
    lng: location.lng,
    accuracy: location.accuracy,
    updatedAt: location.updatedAt,
    etaMinutes,
    customerLat: params.customerLat ?? null,
    customerLng: params.customerLng ?? null,
    status: params.status,
  };
}
