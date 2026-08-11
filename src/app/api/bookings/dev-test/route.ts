import { getSession } from "@/lib/auth/session";
import { createBookingAccessToken } from "@/lib/bookings/access-token";
import {
  assertDevTestBookingEnabled,
  DEV_TEST_BOOKING_LABEL,
  isDevTestBookingEnabled,
} from "@/lib/bookings/dev-test";
import { emitBookingEvent } from "@/lib/bookings/events";
import { getBookingById, insertBooking, upsertPaymentRecord } from "@/lib/bookings/repository";
import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import { calculateBookingPrice, assertPriceMatch } from "@/lib/pricing/calculate";
import { calculateDepositCents } from "@/lib/payments/deposit";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { notifyBookingConfirmed } from "@/lib/notifications";
import { createBookingRequestSchema } from "@/lib/validations/booking-flow";

/** GET — whether the UI may show the DEV_TEST_BOOKING control. */
export async function GET() {
  return jsonSuccess({
    enabled: isDevTestBookingEnabled(),
    label: DEV_TEST_BOOKING_LABEL,
  });
}

/**
 * POST — create a fully paid booking without Stripe (ops testing).
 * Hard-disabled in production. Confirmed bookings still go through server price validation.
 */
export async function POST(request: Request) {
  try {
    assertDevTestBookingEnabled();
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "DEV_TEST_BOOKING is disabled.",
      403,
      "DEV_TEST_BOOKING_DISABLED",
    );
  }

  if (!hasAdminEnv()) {
    return jsonError(
      "Booking storage is not configured. Add Supabase admin env vars.",
      503,
      "SUPABASE_NOT_CONFIGURED",
    );
  }

  try {
    const body = await request.json();
    const parsed = createBookingRequestSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid booking request.", 400);
    }

    if (typeof body.clientTotalCents !== "number") {
      return jsonError("clientTotalCents is required for price validation.", 400);
    }

    const pricing = calculateBookingPrice(parsed.data);
    assertPriceMatch(body.clientTotalCents, pricing.totalCents);

    if (pricing.quoteOnly) {
      return jsonError("Quote-only services cannot use DEV_TEST_BOOKING checkout.", 400);
    }

    const session = await getSession();
    const profileId = session?.profile?.id ?? session?.user.id ?? null;

    const booking = await insertBooking(parsed.data, pricing, profileId);
    const supabase = createAdminClient();
    const depositCents = calculateDepositCents(pricing.totalCents);
    const devPaymentIntentId = `dev_test_${booking.id}`;

    const { data: updated, error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "awaiting_assignment",
        payment_status: "deposit_paid",
        stripe_payment_intent_id: devPaymentIntentId,
      })
      .eq("id", booking.id)
      .eq("status", "pending_payment")
      .select("*")
      .maybeSingle();

    if (updateError) {
      throw new Error(updateError.message);
    }

    if (!updated) {
      return jsonError("Unable to finalize DEV_TEST_BOOKING.", 500);
    }

    await upsertPaymentRecord({
      bookingId: booking.id,
      profileId,
      amountCents: depositCents,
      currency: booking.currency,
      paymentType: depositCents >= pricing.totalCents ? "full" : "deposit",
      stripePaymentIntentId: devPaymentIntentId,
      status: "succeeded",
    });

    await emitBookingEvent({
      bookingId: booking.id,
      type: "payment_succeeded",
      actor: { id: profileId, role: profileId ? "customer" : "guest" },
      metadata: {
        amountCents: depositCents,
        paymentType: "deposit",
        devTestBooking: true,
      },
    });

    const finalized = (await getBookingById(booking.id)) ?? {
      ...booking,
      status: "awaiting_assignment",
      stripe_payment_intent_id: devPaymentIntentId,
    };

    try {
      await notifyBookingConfirmed(finalized, depositCents);
    } catch (notifyError) {
      console.error("[DEV_TEST_BOOKING] confirmation notification failed:", notifyError);
    }

    const accessToken = createBookingAccessToken(booking.id);
    return jsonSuccess(
      {
        booking: finalized,
        pricing,
        accessToken,
        devTest: true,
      },
      201,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create DEV_TEST_BOOKING.";
    const isPriceError = message.includes("Price mismatch");
    const isServiceArea = /not in a MaidLinx service area|outside MaidLinx/i.test(message);
    if (isServiceArea) {
      return jsonError(message, 422, "OUT_OF_SERVICE_AREA");
    }
    return jsonError(message, isPriceError ? 400 : 500);
  }
}
