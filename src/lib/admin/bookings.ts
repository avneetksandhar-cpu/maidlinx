import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";
import {
  emitBookingEvent,
  eventTypeForStatusTransition,
} from "@/lib/bookings/events";
import {
  normalizeBookingStatus,
  validateBookingStatusTransition,
  type BookingStatus,
} from "@/lib/bookings/status";
import type { Database } from "@/types/database.types";

type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"];

export interface AdminBooking {
  id: string;
  status: string;
  serviceType: string;
  scheduledAt: string;
  totalCents: number;
  subtotalCents: number;
  platformFeeCents: number;
  currency: string;
  customerEmail: string | null;
  customerName: string | null;
  professionalName: string | null;
  professionalProfileId: string | null;
  addressCity: string | null;
  addressState: string | null;
  invoiceNumber: string | null;
  createdAt: string;
}

export interface BookingFilters {
  search?: string;
  status?: string;
  serviceType?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface AdminBookingDetail extends AdminBooking {
  marketId: string | null;
  zoneId: string | null;
  serviceId: string | null;
  customerPhone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  addressPostalCode: string | null;
  bedrooms: number;
  bathrooms: number;
  notes: string | null;
  stripePaymentIntentId: string | null;
  payments: Array<{
    id: string;
    status: string;
    amountCents: number;
    paymentType: string;
    createdAt: string;
  }>;
}

function mapBooking(row: Record<string, unknown>): AdminBooking {
  const pro = row.professional as Record<string, unknown> | null;
  return {
    id: String(row.id),
    status: String(row.status),
    serviceType: String(row.service_type),
    scheduledAt: String(row.scheduled_at),
    totalCents: Number(row.total_cents),
    subtotalCents: Number(row.subtotal_cents),
    platformFeeCents: Number(row.platform_fee_cents),
    currency: String(row.currency),
    customerEmail: row.customer_email ? String(row.customer_email) : null,
    customerName: [row.customer_first_name, row.customer_last_name].filter(Boolean).join(" ") || null,
    professionalName: pro
      ? [pro.first_name, pro.last_name].filter(Boolean).join(" ") || null
      : null,
    professionalProfileId: row.professional_profile_id ? String(row.professional_profile_id) : null,
    addressCity: row.address_city ? String(row.address_city) : null,
    addressState: row.address_state ? String(row.address_state) : null,
    invoiceNumber: row.invoice_number ? String(row.invoice_number) : null,
    createdAt: String(row.created_at),
  };
}

export async function listBookings(filters: BookingFilters = {}): Promise<{
  bookings: AdminBooking[];
  total: number;
}> {
  if (!hasAdminEnv()) {
    return { bookings: [], total: 0 };
  }

  const supabase = createAdminClient();
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  let query = supabase
    .from("bookings")
    .select(
      `
      *,
      professional:profiles!bookings_professional_profile_id_fkey (first_name, last_name)
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status as "pending_payment");
  }
  if (filters.serviceType && filters.serviceType !== "all") {
    query = query.eq("service_type", filters.serviceType as "standard");
  }
  if (filters.search) {
    query = query.or(
      `customer_email.ilike.%${filters.search}%,invoice_number.ilike.%${filters.search}%,address_city.ilike.%${filters.search}%`,
    );
  }
  if (filters.dateFrom) {
    query = query.gte("scheduled_at", filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte("scheduled_at", filters.dateTo);
  }

  const { data, error, count } = await query;

  if (error) {
    if (error.message.includes("bookings_professional_profile_id_fkey")) {
      const fallback = await supabase
        .from("bookings")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (fallback.error) throw new Error(fallback.error.message);
      return {
        bookings: (fallback.data ?? []).map((r) => mapBooking(r as Record<string, unknown>)),
        total: fallback.count ?? 0,
      };
    }
    throw new Error(error.message);
  }

  return {
    bookings: (data ?? []).map((r) => mapBooking(r as Record<string, unknown>)),
    total: count ?? 0,
  };
}

export async function bulkUpdateBookings(
  adminId: string,
  ids: string[],
  action: "cancel" | "confirm",
): Promise<number> {
  const supabase = createAdminClient();
  const status = action === "cancel" ? "cancelled" : "awaiting_assignment";

  const { data, error } = await supabase
    .from("bookings")
    .update({
      status,
      ...(action === "cancel" ? { cancelled_at: new Date().toISOString() } : {}),
    })
    .in("id", ids)
    .select("id");

  if (error) throw new Error(error.message);

  await writeAuditLog({
    adminProfileId: adminId,
    action: `bookings.bulk_${action}`,
    entityType: "booking",
    metadata: { ids, count: data?.length ?? 0 },
  });

  return data?.length ?? 0;
}

export async function getBookingDetail(bookingId: string): Promise<AdminBookingDetail | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      *,
      professional:profiles!bookings_professional_profile_id_fkey (first_name, last_name)
    `,
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const { data: payments } = await supabase
    .from("payments")
    .select("id, status, amount_cents, payment_type, created_at")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false });

  const row = data as Record<string, unknown>;
  const base = mapBooking(row);

  return {
    ...base,
    marketId: row.market_id ? String(row.market_id) : null,
    zoneId: row.zone_id ? String(row.zone_id) : null,
    serviceId: row.service_id ? String(row.service_id) : null,
    customerPhone: row.customer_phone ? String(row.customer_phone) : null,
    addressLine1: row.address_line1 ? String(row.address_line1) : null,
    addressLine2: row.address_line2 ? String(row.address_line2) : null,
    addressPostalCode: row.address_postal_code ? String(row.address_postal_code) : null,
    bedrooms: Number(row.bedrooms),
    bathrooms: Number(row.bathrooms),
    notes: row.notes ? String(row.notes) : null,
    stripePaymentIntentId: row.stripe_payment_intent_id
      ? String(row.stripe_payment_intent_id)
      : null,
    payments: (payments ?? []).map((p) => ({
      id: String(p.id),
      status: String(p.status),
      amountCents: Number(p.amount_cents),
      paymentType: String(p.payment_type),
      createdAt: String(p.created_at),
    })),
  };
}

export async function updateBookingStatus(
  adminId: string,
  bookingId: string,
  status: BookingStatus,
): Promise<void> {
  const supabase = createAdminClient();
  const toStatus = normalizeBookingStatus(status) as BookingStatus;

  const { data: current, error: fetchError } = await supabase
    .from("bookings")
    .select("status")
    .eq("id", bookingId)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);
  if (!current) throw new Error("Booking not found.");

  const fromStatus = String(current.status);
  const validation = validateBookingStatusTransition(fromStatus, toStatus);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const updates: BookingUpdate = { status: toStatus };
  if (toStatus === "cancelled") {
    updates.cancelled_at = new Date().toISOString();
  }
  if (toStatus === "completed") {
    updates.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("bookings")
    .update(updates)
    .eq("id", bookingId)
    .eq("status", fromStatus as BookingStatus);

  if (error) throw new Error(error.message);

  await emitBookingEvent({
    bookingId,
    eventType: eventTypeForStatusTransition(toStatus),
    actorType: "admin",
    actorId: adminId,
    payload: { fromStatus, toStatus },
  });

  await writeAuditLog({
    adminProfileId: adminId,
    action: "booking.update_status",
    entityType: "booking",
    entityId: bookingId,
    metadata: { status: toStatus, fromStatus },
  });
}

export async function assignProfessional(
  adminId: string,
  bookingId: string,
  professionalProfileId: string,
): Promise<void> {
  const { adminAssignCleaner } = await import("@/lib/matching/assignment");
  await adminAssignCleaner({
    bookingId,
    professionalProfileId,
    adminId,
    isReassign: false,
  });
}

export async function reassignProfessional(
  adminId: string,
  bookingId: string,
  professionalProfileId: string,
): Promise<void> {
  const { adminAssignCleaner } = await import("@/lib/matching/assignment");
  await adminAssignCleaner({
    bookingId,
    professionalProfileId,
    adminId,
    isReassign: true,
  });
}

export async function cancelAssignment(
  adminId: string,
  bookingId: string,
  reason?: string,
): Promise<void> {
  const { cancelAssignment: cancelMatchAssignment } = await import(
    "@/lib/matching/assignment"
  );
  await cancelMatchAssignment({
    bookingId,
    adminId,
    reason,
  });
}

export async function cancelBooking(
  adminId: string,
  bookingId: string,
  reason?: string,
): Promise<void> {
  await updateBookingStatus(adminId, bookingId, "cancelled");
  await emitBookingEvent({
    bookingId,
    eventType: "cancelled",
    actorType: "admin",
    actorId: adminId,
    payload: { reason: reason ?? null, source: "admin" },
  });
}
