import {
  COMPLETION_PAYMENT_TYPE,
  completionChargeIdempotencyKey,
  isPayAfterCleaningEnabled,
} from "@/lib/payments/pay-after";
import {
  getBookingById,
  upsertPaymentRecord,
  type StoredBooking,
} from "@/lib/bookings/repository";
import { emitBookingEvent } from "@/lib/bookings/events";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeServer } from "@/lib/stripe/server";

export type CompletionChargeResult =
  | { status: "skipped"; reason: string }
  | { status: "already_paid"; paymentIntentId: string | null }
  | { status: "succeeded"; paymentIntentId: string; amountCents: number; receiptUrl: string | null }
  | { status: "failed"; error: string; paymentIntentId?: string | null };

async function markPaymentStatus(
  bookingId: string,
  paymentStatus: "paid" | "failed" | "pending",
  extras?: {
    stripePaymentIntentId?: string | null;
    stripeReceiptUrl?: string | null;
  },
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("bookings")
    .update({
      payment_status: paymentStatus,
      ...(extras?.stripePaymentIntentId
        ? { stripe_payment_intent_id: extras.stripePaymentIntentId }
        : {}),
      ...(extras?.stripeReceiptUrl ? { stripe_receipt_url: extras.stripeReceiptUrl } : {}),
    } as never)
    .eq("id", bookingId);

  if (error) throw new Error(error.message);
}

async function findSucceededCompletionPayment(
  bookingId: string,
): Promise<{ stripePaymentIntentId: string | null } | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("payments")
    .select("stripe_payment_intent_id, status, payment_type")
    .eq("booking_id", bookingId)
    .eq("status", "succeeded")
    .in("payment_type", [COMPLETION_PAYMENT_TYPE, "full"])
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return {
    stripePaymentIntentId: data.stripe_payment_intent_id
      ? String(data.stripe_payment_intent_id)
      : null,
  };
}

/**
 * Charge agreed total once after clean completes (Stripe TEST pay-after model).
 * Safe under double-tap / duplicate webhook: DB paid check + payments row + Stripe idempotency key.
 */
export async function chargeBookingAfterClean(
  bookingId: string,
): Promise<CompletionChargeResult> {
  if (!isPayAfterCleaningEnabled()) {
    return { status: "skipped", reason: "pay_after_disabled" };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return { status: "failed", error: "Stripe is not configured." };
  }

  const booking = await getBookingById(bookingId);
  if (!booking) {
    return { status: "failed", error: "Booking not found." };
  }

  if (booking.payment_status === "paid") {
    return {
      status: "already_paid",
      paymentIntentId: booking.stripe_payment_intent_id,
    };
  }

  const existing = await findSucceededCompletionPayment(bookingId);
  if (existing) {
    await markPaymentStatus(bookingId, "paid", {
      stripePaymentIntentId: existing.stripePaymentIntentId,
    });
    return {
      status: "already_paid",
      paymentIntentId: existing.stripePaymentIntentId,
    };
  }

  if (!booking.stripe_customer_id || !booking.stripe_payment_method_id) {
    await markPaymentStatus(bookingId, "failed");
    await emitBookingEvent({
      bookingId,
      type: "payment_failed",
      actor: { role: "system" },
      metadata: { reason: "missing_payment_method", paymentType: COMPLETION_PAYMENT_TYPE },
    });
    return {
      status: "failed",
      error: "No saved payment method on this booking.",
    };
  }

  const amountCents = booking.total_cents;
  if (!Number.isFinite(amountCents) || amountCents < 50) {
    await markPaymentStatus(bookingId, "failed");
    return { status: "failed", error: "Invalid booking total for charge." };
  }

  const stripe = getStripeServer();
  const idempotencyKey = completionChargeIdempotencyKey(bookingId, amountCents);

  try {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency: booking.currency.toLowerCase(),
        customer: booking.stripe_customer_id,
        payment_method: booking.stripe_payment_method_id,
        off_session: true,
        confirm: true,
        metadata: {
          bookingId,
          paymentType: COMPLETION_PAYMENT_TYPE,
          totalCents: String(amountCents),
        },
        receipt_email: booking.customer_email ?? undefined,
        description: `MaidLinx ${booking.service_type} cleaning (after clean)`,
      },
      { idempotencyKey },
    );

    if (paymentIntent.status === "succeeded") {
      let receiptUrl: string | null = null;
      let chargeId: string | null = null;
      if (paymentIntent.latest_charge) {
        chargeId =
          typeof paymentIntent.latest_charge === "string"
            ? paymentIntent.latest_charge
            : paymentIntent.latest_charge.id;
        const charge = await stripe.charges.retrieve(chargeId);
        receiptUrl = charge.receipt_url ?? null;
      }

      await markPaymentStatus(bookingId, "paid", {
        stripePaymentIntentId: paymentIntent.id,
        stripeReceiptUrl: receiptUrl,
      });

      await upsertPaymentRecord({
        bookingId,
        amountCents: paymentIntent.amount_received || amountCents,
        currency: booking.currency,
        paymentType: COMPLETION_PAYMENT_TYPE,
        stripePaymentIntentId: paymentIntent.id,
        stripeChargeId: chargeId,
        stripeReceiptUrl: receiptUrl,
        status: "succeeded",
      });

      await emitBookingEvent({
        bookingId,
        type: "payment_succeeded",
        actor: { role: "system" },
        metadata: {
          amountCents,
          paymentType: COMPLETION_PAYMENT_TYPE,
          paymentIntentId: paymentIntent.id,
        },
      });

      return {
        status: "succeeded",
        paymentIntentId: paymentIntent.id,
        amountCents,
        receiptUrl,
      };
    }

    // Requires action / processing — treat as needs attention for off-session.
    await markPaymentStatus(bookingId, "failed", {
      stripePaymentIntentId: paymentIntent.id,
    });
    await upsertPaymentRecord({
      bookingId,
      amountCents,
      currency: booking.currency,
      paymentType: COMPLETION_PAYMENT_TYPE,
      stripePaymentIntentId: paymentIntent.id,
      status: "failed",
    });
    await emitBookingEvent({
      bookingId,
      type: "payment_failed",
      actor: { role: "system" },
      metadata: {
        amountCents,
        paymentType: COMPLETION_PAYMENT_TYPE,
        stripeStatus: paymentIntent.status,
      },
    });

    return {
      status: "failed",
      error: `Payment requires attention (status: ${paymentIntent.status}).`,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Charge failed.";
    await markPaymentStatus(bookingId, "failed");
    await emitBookingEvent({
      bookingId,
      type: "payment_failed",
      actor: { role: "system" },
      metadata: { amountCents, paymentType: COMPLETION_PAYMENT_TYPE, error: message },
    });
    return { status: "failed", error: message };
  }
}

/** Apply a succeeded completion PaymentIntent (webhook / confirm sync). Idempotent. */
export async function applySucceededCompletionPayment(params: {
  bookingId: string;
  paymentIntentId: string;
  amountCents: number;
  chargeId?: string | null;
  receiptUrl?: string | null;
}): Promise<StoredBooking | null> {
  const existing = await findSucceededCompletionPayment(params.bookingId);
  if (existing) {
    return getBookingById(params.bookingId);
  }

  await markPaymentStatus(params.bookingId, "paid", {
    stripePaymentIntentId: params.paymentIntentId,
    stripeReceiptUrl: params.receiptUrl ?? null,
  });

  const booking = await getBookingById(params.bookingId);
  if (!booking) return null;

  await upsertPaymentRecord({
    bookingId: params.bookingId,
    amountCents: params.amountCents,
    currency: booking.currency,
    paymentType: COMPLETION_PAYMENT_TYPE,
    stripePaymentIntentId: params.paymentIntentId,
    stripeChargeId: params.chargeId ?? null,
    stripeReceiptUrl: params.receiptUrl ?? null,
    status: "succeeded",
  });

  return getBookingById(params.bookingId);
}
