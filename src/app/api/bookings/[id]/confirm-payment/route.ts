import { BookingAccessError, assertBookingAccess } from "@/lib/bookings/access";
import {
  confirmBookingPayment,
  confirmBookingPaymentMethod,
  getBookingById,
} from "@/lib/bookings/repository";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { notifyBookingConfirmed } from "@/lib/notifications";
import { applySucceededCompletionPayment } from "@/lib/payments/charge-on-complete";
import { COMPLETION_PAYMENT_TYPE, SETUP_PAYMENT_TYPE } from "@/lib/payments/pay-after";
import { getStripeServer } from "@/lib/stripe/server";
import { isPaidBookingStatus, normalizeBookingStatus } from "@/lib/bookings/status";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Sync payment / setup confirmation from Stripe.
 * Complements the webhook so local TEST checkout works even if
 * `stripe listen` is not running. Idempotent.
 *
 * Supports:
 * - SetupIntent (pay-after): saves PM, advances booking without charging
 * - PaymentIntent deposit (legacy)
 * - PaymentIntent completion (after-clean charge recovery)
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const booking = await getBookingById(id);

    if (!booking) {
      return jsonError("Booking not found.", 404);
    }

    const headerToken = request.headers.get("x-booking-access-token");
    let bodyToken: string | null = null;
    let paymentIntentIdFromBody: string | null = null;
    let setupIntentIdFromBody: string | null = null;
    try {
      const body = (await request.json()) as {
        accessToken?: string;
        paymentIntentId?: string;
        setupIntentId?: string;
      };
      bodyToken = body.accessToken ?? null;
      paymentIntentIdFromBody = body.paymentIntentId ?? null;
      setupIntentIdFromBody = body.setupIntentId ?? null;
    } catch {
      bodyToken = null;
    }

    const accessToken = headerToken ?? bodyToken;
    await assertBookingAccess(booking, accessToken);

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("[confirm-payment] STRIPE_SECRET_KEY missing");
      return jsonError("Payment is temporarily unavailable. Please try again shortly.", 503);
    }

    const stripe = getStripeServer();

    // ── SetupIntent path (pay-after) ──
    const setupIntentId =
      setupIntentIdFromBody ?? booking.stripe_setup_intent_id ?? null;

    if (
      setupIntentId &&
      !setupIntentId.startsWith("dev_test_") &&
      (booking.status === "pending_payment" ||
        Boolean(setupIntentIdFromBody) ||
        !booking.stripe_payment_method_id)
    ) {
      const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);

      const setupBookingId = setupIntent.metadata?.bookingId;
      if (setupBookingId && setupBookingId !== booking.id) {
        return jsonError("Setup intent does not match this booking.", 400);
      }

      if (setupIntent.status !== "succeeded") {
        if (isPaidBookingStatus(normalizeBookingStatus(booking.status))) {
          return jsonSuccess({ booking, alreadyConfirmed: true, mode: "setup" });
        }
        return jsonError(
          `Payment method save is not complete (status: ${setupIntent.status}).`,
          402,
          "SETUP_NOT_SUCCEEDED",
        );
      }

      const paymentMethodId =
        typeof setupIntent.payment_method === "string"
          ? setupIntent.payment_method
          : setupIntent.payment_method?.id ?? null;

      if (!paymentMethodId) {
        return jsonError("No payment method on the SetupIntent.", 400);
      }

      const customerId =
        typeof setupIntent.customer === "string"
          ? setupIntent.customer
          : setupIntent.customer?.id ?? booking.stripe_customer_id;

      if (!customerId) {
        return jsonError("No Stripe customer on the SetupIntent.", 400);
      }

      let cardBrand: string | null = null;
      let cardLast4: string | null = null;
      try {
        const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
        cardBrand = pm.card?.brand ?? null;
        cardLast4 = pm.card?.last4 ?? null;
      } catch {
        // Display fields are best-effort.
      }

      const updatedBooking = await confirmBookingPaymentMethod({
        bookingId: booking.id,
        setupIntentId: setupIntent.id,
        stripeCustomerId: customerId,
        paymentMethodId,
        cardBrand,
        cardLast4,
      });

      if (!updatedBooking) {
        return jsonError("Unable to confirm payment method.", 500);
      }

      try {
        await notifyBookingConfirmed(updatedBooking, 0);
      } catch (notifyError) {
        console.error("[confirm-payment] notification failed:", notifyError);
      }

      return jsonSuccess({
        booking: updatedBooking,
        alreadyConfirmed: false,
        mode: "setup",
        paymentType: SETUP_PAYMENT_TYPE,
      });
    }

    if (isPaidBookingStatus(normalizeBookingStatus(booking.status))) {
      // Completion charge recovery for already-completed jobs.
      const paymentIntentId =
        paymentIntentIdFromBody ?? booking.stripe_payment_intent_id ?? null;
      if (
        paymentIntentId &&
        !paymentIntentId.startsWith("dev_test_") &&
        booking.payment_status !== "paid"
      ) {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (
          paymentIntent.status === "succeeded" &&
          paymentIntent.metadata.paymentType === COMPLETION_PAYMENT_TYPE
        ) {
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
          const updated = await applySucceededCompletionPayment({
            bookingId: booking.id,
            paymentIntentId: paymentIntent.id,
            amountCents: paymentIntent.amount_received || paymentIntent.amount,
            chargeId,
            receiptUrl,
          });
          return jsonSuccess({
            booking: updated ?? booking,
            alreadyConfirmed: false,
            mode: "completion",
          });
        }
      }
      return jsonSuccess({ booking, alreadyConfirmed: true });
    }

    if (booking.status !== "pending_payment") {
      return jsonError("Booking is not awaiting payment confirmation.", 400);
    }

    // ── Legacy PaymentIntent deposit path ──
    const paymentIntentId =
      paymentIntentIdFromBody ?? booking.stripe_payment_intent_id ?? null;

    if (!paymentIntentId) {
      return jsonError("No payment intent on this booking yet.", 400);
    }

    if (paymentIntentId.startsWith("dev_test_")) {
      return jsonError("Use the DEV_TEST_BOOKING path for bypass confirmations.", 400);
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.metadata.bookingId && paymentIntent.metadata.bookingId !== booking.id) {
      return jsonError("Payment intent does not match this booking.", 400);
    }

    if (paymentIntent.status !== "succeeded") {
      return jsonError(
        `Payment is not complete (status: ${paymentIntent.status}).`,
        402,
        "PAYMENT_NOT_SUCCEEDED",
      );
    }

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

    const paymentType = paymentIntent.metadata.paymentType ?? "deposit";
    const amountCents = paymentIntent.amount_received || paymentIntent.amount;

    const updatedBooking = await confirmBookingPayment(
      booking.id,
      receiptUrl,
      chargeId,
      paymentIntent.id,
      amountCents,
      paymentType,
    );

    if (!updatedBooking) {
      return jsonError("Unable to confirm booking payment.", 500);
    }

    try {
      await notifyBookingConfirmed(updatedBooking, amountCents);
    } catch (notifyError) {
      console.error("[confirm-payment] notification failed:", notifyError);
    }

    return jsonSuccess({ booking: updatedBooking, alreadyConfirmed: false, mode: "payment" });
  } catch (error) {
    if (error instanceof BookingAccessError) {
      return jsonError(error.message, 403);
    }
    const message = error instanceof Error ? error.message : "Unable to confirm payment.";
    return jsonError(message, 400);
  }
}
