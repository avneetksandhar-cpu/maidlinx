import { calculateBookingPrice, withServerDiscount } from "@/lib/pricing/calculateQuote";
import { createAuthoritativeQuote } from "@/lib/pricing/quotes";
import { PromoValidationError, validatePromoCode } from "@/lib/pricing/promos";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { checkRateLimit, clientIpFromRequest } from "@/lib/api/rate-limit";
import { bookingQuoteSchema } from "@/lib/validations/booking-flow";

function isOutOfServiceArea(error: unknown): boolean {
  return error instanceof Error && /not in a MaidLinx service area|outside MaidLinx/i.test(error.message);
}

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limit = checkRateLimit(`booking:quote:${ip}`, 60, 60_000);
  if (!limit.allowed) {
    return jsonError("Too many quote requests. Try again shortly.", 429, "RATE_LIMITED");
  }

  try {
    const body = await request.json();
    const parsed = bookingQuoteSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid quote request.", 400);
    }

    // Authoritative quote with quoteId / expiresAt (persisted when DB available).
    const pricing = await createAuthoritativeQuote(parsed.data);

    // Also expose live recalculation path for clients that ignore persistence.
    const live = calculateBookingPrice(parsed.data);
    let liveWithPromo = live;
    if (parsed.data.promoCode && !live.quoteOnly) {
      const promo = await validatePromoCode(parsed.data.promoCode, live.subtotalCents);
      if (promo) {
        liveWithPromo = {
          ...withServerDiscount(live, promo.discountCents),
          couponCode: promo.code,
        };
      }
    }

    if (liveWithPromo.totalCents !== pricing.totalCents) {
      // Should not diverge — fail closed if it does.
      return jsonError("Quote engine inconsistency. Retry.", 500, "QUOTE_INCONSISTENT");
    }

    return jsonSuccess({ pricing, quoteId: pricing.quoteId, expiresAt: pricing.expiresAt });
  } catch (error) {
    if (error instanceof PromoValidationError) {
      return jsonError(error.message, 400, "PROMO_INVALID");
    }
    if (isOutOfServiceArea(error)) {
      return jsonError(
        error instanceof Error ? error.message : "This address is not in a MaidLinx service area.",
        422,
        "OUT_OF_SERVICE_AREA",
      );
    }
    return jsonError(
      error instanceof Error ? error.message : "Unable to calculate quote.",
      500,
    );
  }
}
