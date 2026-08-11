import { PAST_BOOKING_STATUSES, UPCOMING_BOOKING_STATUSES } from "@/lib/bookings/status";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveSchedule } from "@/lib/bookings/schedule";
import type { ArrivalWindowId } from "@/lib/bookings/constants";

export interface DashboardBooking {
  id: string;
  status: string;
  serviceType: string;
  scheduledAt: string;
  arrivalWindowStart: string | null;
  arrivalWindowEnd: string | null;
  totalCents: number;
  currency: string;
  addressLine1: string | null;
  addressLine2: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressPostalCode: string | null;
  addressCountry: string | null;
  professionalProfileId: string | null;
  professionalName: string | null;
  invoiceNumber: string | null;
  stripeReceiptUrl: string | null;
  stripePaymentIntentId: string | null;
  createdAt: string;
  cancelledAt: string | null;
}

function mapBooking(row: Record<string, unknown>): DashboardBooking {
  const professional = row.professional as Record<string, unknown> | null;

  return {
    id: String(row.id),
    status: String(row.status),
    serviceType: String(row.service_type),
    scheduledAt: String(row.scheduled_at),
    arrivalWindowStart: row.arrival_window_start ? String(row.arrival_window_start) : null,
    arrivalWindowEnd: row.arrival_window_end ? String(row.arrival_window_end) : null,
    totalCents: Number(row.total_cents),
    currency: String(row.currency),
    addressLine1: row.address_line1 ? String(row.address_line1) : null,
    addressLine2: row.address_line2 ? String(row.address_line2) : null,
    addressCity: row.address_city ? String(row.address_city) : null,
    addressState: row.address_state ? String(row.address_state) : null,
    addressPostalCode: row.address_postal_code ? String(row.address_postal_code) : null,
    addressCountry: row.address_country ? String(row.address_country) : null,
    professionalProfileId: row.professional_profile_id
      ? String(row.professional_profile_id)
      : null,
    professionalName: professional
      ? [professional.first_name, professional.last_name].filter(Boolean).join(" ") || null
      : null,
    invoiceNumber: row.invoice_number ? String(row.invoice_number) : null,
    stripeReceiptUrl: row.stripe_receipt_url ? String(row.stripe_receipt_url) : null,
    stripePaymentIntentId: row.stripe_payment_intent_id
      ? String(row.stripe_payment_intent_id)
      : null,
    createdAt: String(row.created_at),
    cancelledAt: row.cancelled_at ? String(row.cancelled_at) : null,
  };
}

const bookingSelect = `
  *,
  professional:profiles!bookings_professional_profile_id_fkey (
    first_name,
    last_name
  )
`;

export async function getCustomerBookings(
  profileId: string,
  email: string,
  filter: "upcoming" | "past" | "all",
): Promise<DashboardBooking[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("bookings")
    .select(bookingSelect)
    .or(`customer_id.eq.${profileId},customer_email.eq.${email}`)
    .order("scheduled_at", { ascending: filter !== "past" });

  if (filter === "upcoming") {
    query = query.in("status", [...UPCOMING_BOOKING_STATUSES]).gte("scheduled_at", new Date().toISOString());
  } else if (filter === "past") {
    query = query.in("status", [...PAST_BOOKING_STATUSES]);
  }

  const { data, error } = await query;

  // Hide unpaid checkout drafts — paid bookings only (awaiting_assignment+).
  const isVisibleCustomerBooking = (status: string) =>
    status !== "pending_payment" && status !== "draft";

  if (error) {
    if (error.message.includes("bookings_professional_profile_id_fkey")) {
      const fallback = await supabase
        .from("bookings")
        .select("*")
        .or(`customer_id.eq.${profileId},customer_email.eq.${email}`)
        .order("scheduled_at", { ascending: filter !== "past" });

      if (fallback.error) throw new Error(fallback.error.message);
      return (fallback.data ?? [])
        .map((row) => mapBooking(row as Record<string, unknown>))
        .filter((b) => isVisibleCustomerBooking(b.status));
    }
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => mapBooking(row as Record<string, unknown>))
    .filter((b) => isVisibleCustomerBooking(b.status));
}

export async function getBookingForCustomer(
  bookingId: string,
  profileId: string,
  email: string,
): Promise<DashboardBooking | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .or(`customer_id.eq.${profileId},customer_email.eq.${email}`)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapBooking(data as Record<string, unknown>) : null;
}

export async function cancelCustomerBooking(
  bookingId: string,
  profileId: string,
  email: string,
  reason?: string,
): Promise<void> {
  const booking = await getBookingForCustomer(bookingId, profileId, email);
  if (!booking) throw new Error("Booking not found.");

  if (!UPCOMING_BOOKING_STATUSES.includes(booking.status as (typeof UPCOMING_BOOKING_STATUSES)[number])) {
    throw new Error("This booking cannot be cancelled.");
  }

  const scheduled = new Date(booking.scheduledAt).getTime();
  if (scheduled - Date.now() < 24 * 60 * 60 * 1000) {
    throw new Error("Bookings must be cancelled at least 24 hours in advance.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason ?? null,
    })
    .eq("id", bookingId);

  if (error) throw new Error(error.message);

  // Stripe refund architecture — process deposit refund immediately when policy allows.
  const { createCancellationRefund } = await import("@/lib/payments/cancellation-refunds");
  const refund = await createCancellationRefund({
    bookingId,
    actorId: profileId,
    actorRole: "customer",
    reason: reason ?? "Customer cancellation",
    processImmediately: true,
  });

  if (refund.status === "failed") {
    // Booking stays cancelled; refund left failed for admin retry — do not hide.
    console.error("[cancel] refund failed:", refund.message);
  }
}

export async function rescheduleCustomerBooking(
  bookingId: string,
  profileId: string,
  email: string,
  date: string,
  arrivalWindow: ArrivalWindowId,
): Promise<void> {
  const booking = await getBookingForCustomer(bookingId, profileId, email);
  if (!booking) throw new Error("Booking not found.");

  if (!UPCOMING_BOOKING_STATUSES.includes(booking.status as (typeof UPCOMING_BOOKING_STATUSES)[number])) {
    throw new Error("This booking cannot be rescheduled.");
  }

  const schedule = resolveSchedule(date, arrivalWindow);
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("bookings")
    .update({
      scheduled_at: schedule.scheduledAt,
      arrival_window_start: schedule.arrivalWindowStart,
      arrival_window_end: schedule.arrivalWindowEnd,
    })
    .eq("id", bookingId);

  if (error) throw new Error(error.message);
}

export async function getInvoices(profileId: string, email: string): Promise<DashboardBooking[]> {
  const bookings = await getCustomerBookings(profileId, email, "all");
  return bookings.filter(
    (b) =>
      b.invoiceNumber &&
      [
        "pending_payment",
        "confirmed",
        "awaiting_assignment",
        "completed",
        "assigned",
        "on_the_way",
        "arrived",
        "in_progress",
      ].includes(b.status),
  );
}

export async function getReceipts(profileId: string, email: string): Promise<DashboardBooking[]> {
  const bookings = await getCustomerBookings(profileId, email, "past");
  return bookings.filter(
    (b) => b.status === "completed" || (b.status === "awaiting_assignment" && b.stripePaymentIntentId),
  );
}
