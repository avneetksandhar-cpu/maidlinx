import { getSession } from "@/lib/auth/session";
import { createBookingAccessToken } from "@/lib/bookings/access-token";
import { insertBooking } from "@/lib/bookings/repository";
import { assertPriceMatch } from "@/lib/pricing/calculateQuote";
import {
  PromoValidationError,
  recordCouponRedemption,
} from "@/lib/pricing/promos";
import {
  assertQuoteNotExpired,
  loadQuoteById,
  markQuoteConsumed,
} from "@/lib/pricing/quotes";
import { assertMarketBookingEnabled } from "@/lib/markets/flags";
import { resolveServerPricing } from "@/lib/pricing/resolve";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { checkRateLimit, clientIpFromRequest } from "@/lib/api/rate-limit";
import { hasAdminEnv } from "@/lib/supabase/admin";
import { createBookingRequestSchema } from "@/lib/validations/booking-flow";

export async function POST(request: Request) {
  if (!hasAdminEnv()) {
    console.error(
      "[bookings] SUPABASE_NOT_CONFIGURED: missing NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY",
    );
    return jsonError(
      "Booking is temporarily unavailable. Please try again shortly.",
      503,
      "SUPABASE_NOT_CONFIGURED",
    );
  }

  const ip = clientIpFromRequest(request);
  const limit = checkRateLimit(`booking:create:${ip}`, 20, 60_000);
  if (!limit.allowed) {
    return jsonError("Too many booking attempts. Try again shortly.", 429, "RATE_LIMITED");
  }

  try {
    const body = await request.json();
    const parsed = createBookingRequestSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid booking request.", 400);
    }

    if (typeof body.clientTotalCents !== "number") {
      return jsonError("clientTotalCents is required for price validation.", 400, "PRICE_REQUIRED");
    }

    const session = await getSession();
    const profileId = session?.profile?.id ?? session?.user.id ?? null;

    // Server-authoritative pricing (engine when dynamic/recurring/promo; else legacy).
    const resolved = await resolveServerPricing({
      quote: parsed.data,
      profileId,
      schedule: {
        serviceDate: parsed.data.date,
        recurring: parsed.data.recurringFrequency ?? "one_time",
      },
    });
    let pricing = resolved.pricing;
    const appliedPromo = resolved.appliedPromo;
    assertMarketBookingEnabled(resolved.marketId);

    if (parsed.data.quoteId) {
      const stored = await loadQuoteById(parsed.data.quoteId);
      if (!stored) {
        return jsonError("Unknown quoteId. Request a new quote.", 400, "QUOTE_INVALID");
      }
      assertQuoteNotExpired(stored.expiresAt);
      if (stored.consumedByBookingId) {
        return jsonError("Quote already used.", 409, "QUOTE_CONSUMED");
      }
      // Server still recalculates — quoteId is a hint; totals must match live engine.
      if (stored.totalCents !== pricing.totalCents) {
        return jsonError(
          "Quote total is stale. Request a new quote.",
          400,
          "QUOTE_STALE",
        );
      }
      pricing = {
        ...pricing,
        quoteId: stored.id,
        quoteToken: stored.quoteToken,
        expiresAt: stored.expiresAt,
      };
    }

    assertPriceMatch(body.clientTotalCents, pricing.totalCents);

    const booking = await insertBooking(parsed.data, pricing, profileId);

    if (pricing.quoteId) {
      await markQuoteConsumed(pricing.quoteId, booking.id);
    }

    if (appliedPromo && (pricing.discountCents ?? 0) > 0) {
      await recordCouponRedemption({
        couponId: appliedPromo.coupon.id,
        bookingId: booking.id,
        customerId: profileId,
        discountCents: pricing.discountCents ?? 0,
      });
    }

    if (parsed.data.referralCode) {
      try {
        const { captureReferralAttribution } = await import("@/lib/referrals");
        await captureReferralAttribution({
          code: parsed.data.referralCode,
          refereeProfileId: profileId,
          refereeEmail: parsed.data.email,
          bookingId: booking.id,
        });
      } catch (referralError) {
        // Attribution failure must not block booking create.
        console.info(
          "[referral] capture skipped:",
          referralError instanceof Error ? referralError.message : referralError,
        );
      }
    }

    const accessToken = createBookingAccessToken(booking.id);
    return jsonSuccess({ booking, pricing, accessToken }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create booking.";
    if (error instanceof PromoValidationError) {
      return jsonError(message, 400, "PROMO_INVALID");
    }
    const isPriceError = message.includes("Price mismatch") || message.includes("Quote expired");
    const isServiceArea =
      /not in a MaidLinx service area|outside MaidLinx/i.test(message);
    if (isServiceArea) {
      return jsonError(message, 422, "OUT_OF_SERVICE_AREA");
    }
    if (/Booking is not enabled for this market/i.test(message)) {
      return jsonError(message, 403, "BOOKING_DISABLED");
    }
    return jsonError(message, isPriceError ? 400 : 500, isPriceError ? "PRICE_MISMATCH" : undefined);
  }
}
