import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";
import { getStripeServer } from "@/lib/stripe/server";

export interface RefundRecord {
  id: string;
  bookingId: string;
  amountCents: number;
  reason: string | null;
  status: string;
  stripeRefundId: string | null;
  customerEmail: string | null;
  createdAt: string;
}

export async function listRefunds(status?: string): Promise<RefundRecord[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("refunds")
    .select(
      `
      *,
      booking:bookings (customer_email)
    `,
    )
    .order("created_at", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status);

  const { data, error } = await query;

  if (error) {
    if (error.message.includes("refunds")) return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    const booking = record.booking as Record<string, unknown> | null;
    return {
      id: String(record.id),
      bookingId: String(record.booking_id),
      amountCents: Number(record.amount_cents),
      reason: record.reason ? String(record.reason) : null,
      status: String(record.status),
      stripeRefundId: record.stripe_refund_id ? String(record.stripe_refund_id) : null,
      customerEmail: booking?.customer_email ? String(booking.customer_email) : null,
      createdAt: String(record.created_at),
    };
  });
}

export async function createRefund(
  adminId: string,
  input: { bookingId: string; amountCents: number; reason?: string },
): Promise<RefundRecord> {
  const supabase = createAdminClient();

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("stripe_payment_intent_id, total_cents")
    .eq("id", input.bookingId)
    .maybeSingle();

  if (bookingError || !booking) throw new Error("Booking not found.");

  const { data, error } = await supabase
    .from("refunds")
    .insert({
      booking_id: input.bookingId,
      amount_cents: input.amountCents,
      reason: input.reason ?? null,
      status: "pending",
      processed_by: adminId,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create refund.");

  await writeAuditLog({
    adminProfileId: adminId,
    action: "refund.create",
    entityType: "refund",
    entityId: String(data.id),
    metadata: input,
  });

  const record = data as Record<string, unknown>;
  return {
    id: String(record.id),
    bookingId: String(record.booking_id),
    amountCents: Number(record.amount_cents),
    reason: record.reason ? String(record.reason) : null,
    status: String(record.status),
    stripeRefundId: null,
    customerEmail: null,
    createdAt: String(record.created_at),
  };
}

export async function processRefund(adminId: string, refundId: string): Promise<void> {
  const supabase = createAdminClient();

  const { data: refund, error: refundError } = await supabase
    .from("refunds")
    .select("*, booking:bookings(stripe_payment_intent_id)")
    .eq("id", refundId)
    .maybeSingle();

  if (refundError || !refund) throw new Error("Refund not found.");

  const record = refund as Record<string, unknown>;
  const booking = record.booking as Record<string, unknown> | null;
  const paymentIntentId = booking?.stripe_payment_intent_id
    ? String(booking.stripe_payment_intent_id)
    : null;

  if (!paymentIntentId) throw new Error("No payment intent found for this booking.");

  try {
    const stripe = getStripeServer();
    const stripeRefund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: Number(record.amount_cents),
    });

    await supabase
      .from("refunds")
      .update({
        status: "processed",
        stripe_refund_id: stripeRefund.id,
      })
      .eq("id", refundId);

    await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", String(record.booking_id));

    await writeAuditLog({
      adminProfileId: adminId,
      action: "refund.process",
      entityType: "refund",
      entityId: refundId,
      metadata: { stripeRefundId: stripeRefund.id },
    });
  } catch (err) {
    await supabase.from("refunds").update({ status: "failed" }).eq("id", refundId);
    throw err instanceof Error ? err : new Error("Stripe refund failed.");
  }
}

export async function bulkCreateRefunds(
  adminId: string,
  items: Array<{ bookingId: string; amountCents: number; reason?: string }>,
): Promise<number> {
  let count = 0;
  for (const item of items) {
    await createRefund(adminId, item);
    count += 1;
  }
  return count;
}
