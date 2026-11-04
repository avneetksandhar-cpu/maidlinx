import { BookingAccessError, assertBookingAccess } from "@/lib/bookings/access";
import { getBookingById } from "@/lib/bookings/repository";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { checkRateLimit, clientIpFromRequest } from "@/lib/api/rate-limit";
import { chargeBookingAfterClean } from "@/lib/payments/charge-on-complete";
import { isPayAfterCleaningEnabled } from "@/lib/payments/pay-after";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Retry the single after-clean charge (idempotent). Used after updating the card
 * when payment_status is failed. Never creates a second successful charge.
 */
export async function POST(request: Request, context: RouteContext) {
  const ip = clientIpFromRequest(request);
  const limit = checkRateLimit(`booking:retry-charge:${ip}`, 10, 60_000);
  if (!limit.allowed) {
    return jsonError("Too many attempts.", 429, "RATE_LIMITED");
  }

  if (!isPayAfterCleaningEnabled()) {
    return jsonError("Pay-after charging is not enabled.", 400);
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

    if (booking.status !== "completed") {
      return jsonError("Charge retry is only available after the clean is complete.", 400);
    }

    if (booking.payment_status === "paid") {
      return jsonSuccess({
        status: "already_paid",
        booking,
      });
    }

    const result = await chargeBookingAfterClean(id);
    const refreshed = await getBookingById(id);

    if (result.status === "failed") {
      return jsonError(result.error, 402, "CHARGE_FAILED");
    }

    return jsonSuccess({
      status: result.status,
      booking: refreshed,
      paymentIntentId:
        result.status === "succeeded" || result.status === "already_paid"
          ? result.paymentIntentId
          : null,
    });
  } catch (error) {
    if (error instanceof BookingAccessError) {
      return jsonError(error.message, 403);
    }
    const message = error instanceof Error ? error.message : "Unable to retry charge.";
    return jsonError(message, 400);
  }
}
