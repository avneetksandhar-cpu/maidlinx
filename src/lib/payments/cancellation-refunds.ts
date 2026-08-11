/**
 * Cancellation → Stripe refund architecture.
 * Customer cancel creates a pending/processed refund against the deposit PI.
 * Never invents refund success without Stripe (or explicit admin process).
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import { getStripeServer } from "@/lib/stripe/server";
import { emitBookingEvent } from "@/lib/bookings/events";
import { writeAuditLog } from "@/lib/admin/audit";

export interface CancellationRefundResult {
  refundId: string | null;
  status: "none" | "pending" | "processed" | "failed" | "skipped_dev_payment";
  amountCents: number;
  stripeRefundId: string | null;
  message: string;
}

/**
 * After a booking is marked cancelled, attempt deposit refund via Stripe.
 * Policy: full deposit refund when cancelled ≥24h before scheduled_at (caller enforces window).
 */
export async function createCancellationRefund(input: {
  bookingId: string;
  actorId?: string | null;
  actorRole?: "customer" | "admin" | "system";
  reason?: string | null;
  /** When true, create Stripe refund immediately; else leave pending for ops. */
  processImmediately?: boolean;
}): Promise<CancellationRefundResult> {
  if (!hasAdminEnv()) {
    return {
      refundId: null,
      status: "none",
      amountCents: 0,
      stripeRefundId: null,
      message: "Database not configured.",
    };
  }

  const supabase = createAdminClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, status, stripe_payment_intent_id, currency, total_cents, payment_status")
    .eq("id", input.bookingId)
    .maybeSingle();

  if (error || !booking) {
    return {
      refundId: null,
      status: "none",
      amountCents: 0,
      stripeRefundId: null,
      message: "Booking not found.",
    };
  }

  const row = booking as Record<string, unknown>;
  const pi = row.stripe_payment_intent_id ? String(row.stripe_payment_intent_id) : null;

  if (!pi) {
    return {
      refundId: null,
      status: "none",
      amountCents: 0,
      stripeRefundId: null,
      message: "No payment to refund.",
    };
  }

  if (pi.startsWith("dev_test_")) {
    return {
      refundId: null,
      status: "skipped_dev_payment",
      amountCents: 0,
      stripeRefundId: null,
      message: "DEV_TEST_BOOKING payments are not refunded via Stripe.",
    };
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("amount_cents, status")
    .eq("stripe_payment_intent_id", pi)
    .eq("status", "succeeded")
    .maybeSingle();

  const amountCents = payment
    ? Number((payment as { amount_cents: number }).amount_cents)
    : 0;

  if (amountCents <= 0) {
    return {
      refundId: null,
      status: "none",
      amountCents: 0,
      stripeRefundId: null,
      message: "No succeeded payment amount found.",
    };
  }

  const { data: refundRow, error: refundError } = await supabase
    .from("refunds")
    .insert({
      booking_id: input.bookingId,
      amount_cents: amountCents,
      reason: input.reason ?? "Customer cancellation",
      status: "pending",
      processed_by: input.actorRole === "admin" ? input.actorId ?? null : null,
    })
    .select("id")
    .single();

  if (refundError || !refundRow) {
    if (/refunds|does not exist/i.test(refundError?.message ?? "")) {
      return {
        refundId: null,
        status: "none",
        amountCents,
        stripeRefundId: null,
        message: "Refunds table unavailable.",
      };
    }
    throw new Error(refundError?.message ?? "Unable to create refund.");
  }

  const refundId = String(refundRow.id);

  await emitBookingEvent({
    bookingId: input.bookingId,
    type: "refund_requested",
    actor: {
      id: input.actorId ?? null,
      role: input.actorRole ?? "system",
    },
    metadata: { refundId, amountCents, reason: input.reason ?? null },
  });

  if (!input.processImmediately) {
    return {
      refundId,
      status: "pending",
      amountCents,
      stripeRefundId: null,
      message: "Refund recorded as pending for Stripe processing.",
    };
  }

  try {
    const stripe = getStripeServer();
    const stripeRefund = await stripe.refunds.create(
      {
        payment_intent: pi,
        amount: amountCents,
        reason: "requested_by_customer",
        metadata: {
          bookingId: input.bookingId,
          refundId,
        },
      },
      { idempotencyKey: `maidlinx_cancel_refund_${input.bookingId}_${refundId}` },
    );

    await supabase
      .from("refunds")
      .update({ status: "processed", stripe_refund_id: stripeRefund.id })
      .eq("id", refundId);

    await supabase
      .from("payments")
      .update({ status: "refunded" })
      .eq("stripe_payment_intent_id", pi);

    await supabase
      .from("bookings")
      .update({ payment_status: "refunded" })
      .eq("id", input.bookingId);

    if (input.actorId && input.actorRole === "admin") {
      await writeAuditLog({
        adminProfileId: input.actorId,
        action: "refund.auto_cancel",
        entityType: "refund",
        entityId: refundId,
        metadata: { stripeRefundId: stripeRefund.id, bookingId: input.bookingId },
      });
    }

    await emitBookingEvent({
      bookingId: input.bookingId,
      type: "refund_processed",
      actor: { role: "system" },
      metadata: { refundId, stripeRefundId: stripeRefund.id, amountCents },
    });

    return {
      refundId,
      status: "processed",
      amountCents,
      stripeRefundId: stripeRefund.id,
      message: "Stripe refund processed.",
    };
  } catch (err) {
    await supabase.from("refunds").update({ status: "failed" }).eq("id", refundId);
    return {
      refundId,
      status: "failed",
      amountCents,
      stripeRefundId: null,
      message: err instanceof Error ? err.message : "Stripe refund failed.",
    };
  }
}
