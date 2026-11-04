/**
 * Cleaner earnings ledger — pending payout row created when a job completes.
 * Connect transfer is separate (STRIPE_CONNECT_ENABLED); this records the obligation.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";

export async function recordPendingPayoutForCompletedBooking(
  bookingId: string,
): Promise<{ created: boolean; reason?: string }> {
  if (!hasAdminEnv()) return { created: false, reason: "admin_env_missing" };

  const supabase = createAdminClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, cleaner_id, subtotal_cents, platform_fee_cents, total_cents, currency, status")
    .eq("id", bookingId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!booking) return { created: false, reason: "booking_not_found" };
  if (String(booking.status) !== "completed") {
    return { created: false, reason: "not_completed" };
  }
  if (!booking.cleaner_id) return { created: false, reason: "no_cleaner" };

  const amountCents = Number(booking.subtotal_cents);
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return { created: false, reason: "invalid_amount" };
  }

  const { data: existing } = await supabase
    .from("payouts")
    .select("id")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (existing) return { created: false, reason: "already_exists" };

  const { error: insertError } = await supabase.from("payouts").insert({
    cleaner_id: String(booking.cleaner_id),
    booking_id: bookingId,
    amount_cents: amountCents,
    currency: String(booking.currency ?? "USD"),
    platform_fee_cents: Number(booking.platform_fee_cents ?? 0),
    customer_total_cents: Number(booking.total_cents ?? 0),
    status: "pending",
    notes: "Auto-created on job completion",
  });

  if (insertError) {
    if (/payouts|does not exist|schema cache/i.test(insertError.message)) {
      return { created: false, reason: "table_unavailable" };
    }
    if (/duplicate|unique/i.test(insertError.message)) {
      return { created: false, reason: "already_exists" };
    }
    throw new Error(insertError.message);
  }

  return { created: true };
}
