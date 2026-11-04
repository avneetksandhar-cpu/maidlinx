import { BookingAccessError, assertBookingAccess } from "@/lib/bookings/access";
import { attachSetupIntent, getBookingById } from "@/lib/bookings/repository";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { checkRateLimit, clientIpFromRequest } from "@/lib/api/rate-limit";
import { SETUP_PAYMENT_TYPE } from "@/lib/payments/pay-after";
import { getStripeServer } from "@/lib/stripe/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const REUSABLE_SETUP_STATUSES = new Set([
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
]);

/**
 * Failed after-clean charge recovery: create a fresh SetupIntent to replace the card.
 * Does not charge. Customer confirms SetupIntent; then admin/cleaner retry or
 * POST /confirm-payment + charge path can run again via complete re-try endpoint.
 */
export async function POST(request: Request, context: RouteContext) {
  const ip = clientIpFromRequest(request);
  const limit = checkRateLimit(`booking:update-payment:${ip}`, 20, 60_000);
  if (!limit.allowed) {
    return jsonError("Too many attempts.", 429, "RATE_LIMITED");
  }

  try {
    const { id } = await context.params;
    const headerToken = request.headers.get("x-booking-access-token");
    let bodyToken: string | null = null;
    try {
      const body = (await request.json()) as { accessToken?: string };
      bodyToken = body.accessToken ?? null;
    } catch {
      bodyToken = null;
    }

    const booking = await getBookingById(id);
    if (!booking) return jsonError("Booking not found.", 404);

    await assertBookingAccess(booking, headerToken ?? bodyToken);

    if (booking.payment_status === "paid") {
      return jsonError("This booking is already paid.", 400, "ALREADY_PAID");
    }

    if (booking.status !== "completed" && booking.payment_status !== "failed") {
      return jsonError("Payment method update is only available when payment needs attention.", 400);
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return jsonError("Payment is temporarily unavailable. Please try again shortly.", 503);
    }

    const stripe = getStripeServer();
    let customerId = booking.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: booking.customer_email ?? undefined,
        metadata: { bookingId: booking.id },
      });
      customerId = customer.id;
    }

    if (booking.stripe_setup_intent_id) {
      try {
        const existing = await stripe.setupIntents.retrieve(booking.stripe_setup_intent_id);
        if (
          existing.client_secret &&
          REUSABLE_SETUP_STATUSES.has(existing.status) &&
          existing.customer === customerId
        ) {
          return jsonSuccess({
            mode: "setup",
            clientSecret: existing.client_secret,
            setupIntentId: existing.id,
            reused: true,
          });
        }
      } catch {
        // create fresh
      }
    }

    const setupIntent = await stripe.setupIntents.create(
      {
        customer: customerId,
        payment_method_types: ["card"],
        usage: "off_session",
        metadata: {
          bookingId: booking.id,
          paymentType: SETUP_PAYMENT_TYPE,
          purpose: "update_after_failed_charge",
          totalCents: String(booking.total_cents),
        },
      },
      { idempotencyKey: `maidlinx_update_pm_${booking.id}_${Date.now()}` },
    );

    if (!setupIntent.client_secret) {
      return jsonError("Unable to start payment method update.", 500);
    }

    await attachSetupIntent(booking.id, {
      setupIntentId: setupIntent.id,
      stripeCustomerId: customerId,
    });

    return jsonSuccess({
      mode: "setup",
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
      reused: false,
    });
  } catch (error) {
    if (error instanceof BookingAccessError) {
      return jsonError(error.message, 403);
    }
    const message = error instanceof Error ? error.message : "Unable to update payment method.";
    return jsonError(message, 400);
  }
}
