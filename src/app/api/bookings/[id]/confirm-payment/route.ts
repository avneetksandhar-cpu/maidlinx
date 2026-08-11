import { BookingAccessError, assertBookingAccess } from "@/lib/bookings/access";
import { confirmBookingPayment, getBookingById } from "@/lib/bookings/repository";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { notifyBookingConfirmed } from "@/lib/notifications";
import { getStripeServer } from "@/lib/stripe/server";
import { isPaidBookingStatus, normalizeBookingStatus } from "@/lib/bookings/status";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Sync payment confirmation from Stripe PaymentIntent status.
 * Complements the webhook so local TEST checkout works even if
 * `stripe listen` is not running. Idempotent.
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
    try {
      const body = (await request.json()) as {
        accessToken?: string;
        paymentIntentId?: string;
      };
      bodyToken = body.accessToken ?? null;
      paymentIntentIdFromBody = body.paymentIntentId ?? null;
    } catch {
      bodyToken = null;
    }

    const accessToken = headerToken ?? bodyToken;
    await assertBookingAccess(booking, accessToken);

    if (isPaidBookingStatus(normalizeBookingStatus(booking.status))) {
      return jsonSuccess({ booking, alreadyConfirmed: true });
    }

    if (booking.status !== "pending_payment") {
      return jsonError("Booking is not awaiting payment confirmation.", 400);
    }

    const paymentIntentId =
      paymentIntentIdFromBody ?? booking.stripe_payment_intent_id ?? null;

    if (!paymentIntentId) {
      return jsonError("No payment intent on this booking yet.", 400);
    }

    if (paymentIntentId.startsWith("dev_test_")) {
      return jsonError("Use the DEV_TEST_BOOKING path for bypass confirmations.", 400);
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return jsonError("Payment is not configured.", 503);
    }

    const stripe = getStripeServer();
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

    return jsonSuccess({ booking: updatedBooking, alreadyConfirmed: false });
  } catch (error) {
    if (error instanceof BookingAccessError) {
      return jsonError(error.message, 403);
    }
    const message = error instanceof Error ? error.message : "Unable to confirm payment.";
    return jsonError(message, 400);
  }
}
